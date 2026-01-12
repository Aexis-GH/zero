package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"math"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type step int

const (
	stepStartup step = iota
	stepDirectory
	stepName
	stepDomain
	stepFramework
	stepModules
	stepConfirm
	stepPackageManager
)

type framework string

type module string

type packageManager string

const (
	frameworkNext framework = "nextjs"
	frameworkExpo framework = "expo"
)

var moduleOptions = []module{"neon", "clerk", "payload", "stripe", "email"}
var moduleLabels = []string{"DB", "Auth", "CMS", "Payments", "Email"}

var frameworkOptions = []framework{frameworkNext, frameworkExpo}

var packageManagerOptions = []packageManager{"npm", "pnpm", "yarn", "bun"}

type config struct {
	Directory string   `json:"directory"`
	AppName   string   `json:"appName"`
	Domain    string   `json:"domain"`
	Framework string   `json:"framework"`
	Modules   []string `json:"modules"`
	Package   string   `json:"packageManager"`
}

type particle struct {
	baseRadius   float64
	baseAngle    float64
	offsetRadius float64
	offsetAngle  float64
	speed        float64
}

type model struct {
	step         step
	directory    textinput.Model
	name         textinput.Model
	domain       textinput.Model
	frameworkIdx int
	moduleIdx    int
	selected     map[module]bool
	confirmIdx   int
	pkgIdx       int
	err          string
	result       *config
	cancelled    bool
	fg           lipgloss.AdaptiveColor
	muted        lipgloss.AdaptiveColor
	accent       lipgloss.AdaptiveColor

	// Slashed zero animation
	particles   []*particle
	startupTime time.Time
	rotation    float64
}

func newModel() model {
	// Use terminal colors for proper visibility
	fg := lipgloss.AdaptiveColor{Light: "#1C1917", Dark: "#E7E5E4"}
	muted := lipgloss.AdaptiveColor{Light: "#6B7280", Dark: "#9CA3AF"}
	accent := lipgloss.AdaptiveColor{Light: "#374151", Dark: "#D1D5DB"}

	dirInput := textinput.New()
	dirInput.Placeholder = "."
	dirInput.SetValue(".")
	dirInput.Focus()
	dirInput.CharLimit = 120

	nameInput := textinput.New()
	nameInput.CharLimit = 80
	nameInput.Focus()

	domainInput := textinput.New()
	domainInput.CharLimit = 120

	// Create particles for slashed zero shape
	particles := make([]*particle, 0)

	// Create circle outline
	for i := 0; i < 120; i++ {
		angle := float64(i) / 120.0 * 2.0 * math.Pi
		particle := &particle{
			baseRadius:   12.0,
			baseAngle:    angle,
			offsetRadius: 0,
			offsetAngle:  0,
			speed:        0.02 + rand.Float64()*0.01,
		}
		particles = append(particles, particle)
	}

	// Create diagonal slash
	for i := 0; i < 40; i++ {
		t := float64(i) / 39.0
		x := -8.0 + t*16.0
		y := 8.0 - t*16.0
		angle := math.Atan2(y, x)
		radius := math.Sqrt(x*x + y*y)

		particle := &particle{
			baseRadius:   radius,
			baseAngle:    angle,
			offsetRadius: 0,
			offsetAngle:  0,
			speed:        0.02 + rand.Float64()*0.01,
		}
		particles = append(particles, particle)
	}

	return model{
		step:        stepStartup,
		directory:   dirInput,
		name:        nameInput,
		domain:      domainInput,
		selected:    map[module]bool{},
		fg:          fg,
		muted:       muted,
		accent:      accent,
		particles:   particles,
		startupTime: time.Now(),
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, tea.Tick(time.Millisecond*100, func(t time.Time) tea.Msg {
		return animationFrameMsg(t)
	}))
}

type animationFrameMsg time.Time

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case animationFrameMsg:
		// Update rotation slowly
		m.rotation += 0.008

		// Update particle positions
		for _, particle := range m.particles {
			particle.offsetRadius = math.Sin(m.rotation*particle.speed) * 0.5
			particle.offsetAngle = math.Cos(m.rotation*particle.speed*1.5) * 0.1
		}

		if m.step == stepStartup && time.Since(m.startupTime) > time.Second*3 {
			m.step = stepDirectory
			m.directory.Focus()
		}

		return m, tea.Tick(time.Millisecond*100, func(t time.Time) tea.Msg {
			return animationFrameMsg(t)
		})

	case tea.KeyMsg:
		if m.step == stepStartup {
			m.step = stepDirectory
			m.directory.Focus()
			return m, nil
		}

		switch msg.String() {
		case "ctrl+c", "esc":
			m.cancelled = true
			return m, tea.Quit
		case "enter":
			return m.handleEnter()
		case "up":
			return m.handleUp()
		case "down":
			return m.handleDown()
		case " ":
			return m.handleSpace()
		}
	}

	switch m.step {
	case stepDirectory:
		var cmd tea.Cmd
		m.directory, cmd = m.directory.Update(msg)
		return m, cmd
	case stepName:
		var cmd tea.Cmd
		m.name, cmd = m.name.Update(msg)
		return m, cmd
	case stepDomain:
		var cmd tea.Cmd
		m.domain, cmd = m.domain.Update(msg)
		return m, cmd
	}

	return m, nil
}

func (m model) handleEnter() (tea.Model, tea.Cmd) {
	m.err = ""
	switch m.step {
	case stepDirectory:
		value := strings.TrimSpace(m.directory.Value())
		if value == "" {
			value = "."
		}
		m.directory.SetValue(value)
		m.directory.Blur()
		m.step = stepName
		m.name.Focus()
		return m, nil
	case stepName:
		value := strings.TrimSpace(m.name.Value())
		if value == "" {
			m.err = "App name is required."
			return m, nil
		}
		m.name.Blur()
		m.step = stepDomain
		m.domain.Focus()
		return m, nil
	case stepDomain:
		m.step = stepFramework
		return m, nil
	case stepFramework:
		m.step = stepModules
		return m, nil
	case stepModules:
		m.step = stepConfirm
		return m, nil
	case stepConfirm:
		switch m.confirmIdx {
		case 0:
			m.step = stepPackageManager
			return m, nil
		case 1:
			m.step = stepDirectory
			m.directory.Focus()
		case 2:
			m.step = stepName
			m.name.Focus()
		case 3:
			m.step = stepDomain
			m.domain.Focus()
		case 4:
			m.step = stepFramework
		case 5:
			m.step = stepModules
		case 6:
			m.cancelled = true
			return m, tea.Quit
		}
	case stepPackageManager:
		m.result = &config{
			Directory: strings.TrimSpace(m.directory.Value()),
			AppName:   strings.TrimSpace(m.name.Value()),
			Domain:    strings.TrimSpace(m.domain.Value()),
			Framework: string(frameworkOptions[m.frameworkIdx]),
			Modules:   m.selectedModules(),
			Package:   string(packageManagerOptions[m.pkgIdx]),
		}
		return m, tea.Quit
	}
	return m, nil
}

func (m model) handleUp() (tea.Model, tea.Cmd) {
	switch m.step {
	case stepFramework:
		if m.frameworkIdx > 0 {
			m.frameworkIdx--
		}
	case stepModules:
		if m.moduleIdx > 0 {
			m.moduleIdx--
		}
	case stepConfirm:
		if m.confirmIdx > 0 {
			m.confirmIdx--
		}
	case stepPackageManager:
		if m.pkgIdx > 0 {
			m.pkgIdx--
		}
	}
	return m, nil
}

func (m model) handleDown() (tea.Model, tea.Cmd) {
	switch m.step {
	case stepFramework:
		if m.frameworkIdx < len(frameworkOptions)-1 {
			m.frameworkIdx++
		}
	case stepModules:
		if m.moduleIdx > 0 {
			m.moduleIdx++
		}
	case stepConfirm:
		if m.confirmIdx < 6 {
			m.confirmIdx++
		}
	case stepPackageManager:
		if m.pkgIdx < len(packageManagerOptions)-1 {
			m.pkgIdx++
		}
	}
	return m, nil
}

func (m model) handleSpace() (tea.Model, tea.Cmd) {
	switch m.step {
	case stepModules:
		selected := moduleOptions[m.moduleIdx]
		m.selected[selected] = !m.selected[selected]
		return m, nil
	case stepFramework, stepConfirm, stepPackageManager:
		return m.handleEnter()
	default:
		return m, nil
	}
}

func (m model) View() string {
	if m.cancelled {
		return ""
	}

	base := lipgloss.NewStyle().Foreground(m.fg)
	muted := lipgloss.NewStyle().Foreground(m.muted)

	if m.step == stepStartup {
		return m.renderStartup()
	}

	// Header with mini slashed zero
	header := m.renderMiniSlashedZero()
	divider := strings.Repeat("─", 80)

	content := ""
	if m.err != "" {
		content += muted.Render(m.err) + "\n"
	}

	switch m.step {
	case stepDirectory:
		content += base.Render("Directory (default: .)") + "\n" + m.directory.View() + "\n"
	case stepName:
		content += base.Render("App name") + "\n" + m.name.View() + "\n"
	case stepDomain:
		content += base.Render("Domain (optional)") + "\n" + m.domain.View() + "\n"
	case stepFramework:
		content += base.Render("Framework") + "\n" + renderFrameworkOptions(m.frameworkIdx)
	case stepModules:
		content += base.Render("Modules") + "\n" + renderModuleOptions(m.moduleIdx, m.selected)
	case stepConfirm:
		content += base.Render("Review") + "\n"
		content += muted.Render(fmt.Sprintf("Directory: %s", m.directory.Value())) + "\n"
		content += muted.Render(fmt.Sprintf("App name: %s", m.name.Value())) + "\n"
		content += muted.Render(fmt.Sprintf("Domain: %s", m.domain.Value())) + "\n"
		content += muted.Render(fmt.Sprintf("Framework: %s", formatFramework(frameworkOptions[m.frameworkIdx]))) + "\n"
		modulesLabel := "None"
		if modules := m.selectedModuleLabels(); len(modules) > 0 {
			modulesLabel = strings.Join(modules, ", ")
		}
		content += muted.Render(fmt.Sprintf("Modules: %s", modulesLabel)) + "\n\n"
		content += renderConfirm(m.confirmIdx)
	case stepPackageManager:
		content += base.Render("Package manager") + "\n" + renderPackageManagerOptions(m.pkgIdx)
	}

	footer := muted.Render("↑/↓ move • space toggle • enter confirm • esc cancel")
	return strings.Join([]string{header, divider, content, divider, footer}, "\n")
}

func (m model) renderSlashedZero() string {
	// Create field for slashed zero
	field := make([][]string, 16)
	for i := range field {
		field[i] = make([]string, 80)
		for j := range field[i] {
			field[i][j] = " "
		}
	}

	// Place particles
	for _, particle := range m.particles {
		angle := particle.baseAngle + m.rotation + particle.offsetAngle
		radius := particle.baseRadius + particle.offsetRadius

		x := 40.0 + radius*math.Cos(angle)
		y := 8.0 + radius*math.Sin(angle)

		ix, iy := int(x), int(y)
		if iy >= 0 && iy < 16 && ix >= 0 && ix < 80 {
			style := lipgloss.NewStyle().Foreground(m.accent)
			field[iy][ix] = style.Render("•")
		}
	}

	// Build display
	var lines []string
	for _, row := range field {
		lines = append(lines, strings.Join(row, ""))
	}

	return strings.Join(lines, "\n")
}

func (m model) renderMiniSlashedZero() string {
	// Small version for header
	field := make([][]string, 6)
	for i := range field {
		field[i] = make([]string, 80)
		for j := range field[i] {
			field[i][j] = " "
		}
	}

	// Scale down particles for mini version
	for _, particle := range m.particles {
		angle := particle.baseAngle + m.rotation + particle.offsetAngle
		radius := (particle.baseRadius + particle.offsetRadius) * 0.3

		x := 40.0 + radius*math.Cos(angle)
		y := 2.5 + radius*math.Sin(angle)

		ix, iy := int(x), int(y)
		if iy >= 0 && iy < 6 && ix >= 0 && ix < 80 {
			style := lipgloss.NewStyle().Foreground(m.muted)
			field[iy][ix] = style.Render("·")
		}
	}

	// Build display
	var lines []string
	for _, row := range field {
		lines = append(lines, strings.Join(row, ""))
	}

	result := strings.Join(lines, "\n")
	title := lipgloss.NewStyle().Foreground(m.fg).Render("ZER0")

	return result + "\n" + title
}

func (m model) renderStartup() string {
	muted := lipgloss.NewStyle().Foreground(m.muted)

	// Full screen slashed zero animation
	slashedZero := m.renderSlashedZero()

	// Message below
	subtitle := muted.Render("Starting from 0...")
	subtitleLine := strings.Repeat(" ", 36) + subtitle

	return slashedZero + "\n\n" + subtitleLine
}

func renderFrameworkOptions(active int) string {
	labels := []string{"Next.js", "Expo"}
	lines := make([]string, 0, len(labels))
	for i, label := range labels {
		cursor := " "
		if i == active {
			cursor = "▶"
		}
		// Cool radio design
		radio := "○"
		if i == active {
			radio = "◉"
		}
		style := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#1C1917", Dark: "#E7E5E4"})
		if i == active {
			style = style.Foreground(lipgloss.AdaptiveColor{Light: "#374151", Dark: "#D1D5DB"})
		}
		lines = append(lines, fmt.Sprintf("%s %s %s", cursor, radio, style.Render(label)))
	}
	return strings.Join(lines, "\n") + "\n"
}

func renderModuleOptions(active int, selected map[module]bool) string {
	lines := make([]string, 0, len(moduleLabels))
	for i, label := range moduleLabels {
		cursor := " "
		if i == active {
			cursor = "▶"
		}
		// Cool checkbox design
		checkbox := "□"
		if selected[moduleOptions[i]] {
			checkbox = "■"
		}
		style := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#1C1917", Dark: "#E7E5E4"})
		if i == active {
			style = style.Foreground(lipgloss.AdaptiveColor{Light: "#374151", Dark: "#D1D5DB"})
		}
		lines = append(lines, fmt.Sprintf("%s %s %s", cursor, checkbox, style.Render(label)))
	}
	return strings.Join(lines, "\n") + "\n"
}

func renderConfirm(active int) string {
	actions := []string{
		"Continue",
		"Edit directory",
		"Edit name",
		"Edit domain",
		"Edit framework",
		"Edit modules",
		"Cancel",
	}
	lines := make([]string, 0, len(actions))
	for i, action := range actions {
		cursor := " "
		if i == active {
			cursor = "▶"
		}
		// Cool selection indicator
		indicator := "○"
		if i == active {
			indicator = "◉"
		}
		style := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#1C1917", Dark: "#E7E5E4"})
		if i == active {
			style = style.Foreground(lipgloss.AdaptiveColor{Light: "#374151", Dark: "#D1D5DB"})
		}
		lines = append(lines, fmt.Sprintf("%s %s %s", cursor, indicator, style.Render(action)))
	}
	return strings.Join(lines, "\n")
}

func renderPackageManagerOptions(active int) string {
	labels := []string{"npm", "pnpm", "yarn", "bun"}
	lines := make([]string, 0, len(labels))
	for i, label := range labels {
		cursor := " "
		if i == active {
			cursor = "▶"
		}
		// Cool radio design
		radio := "○"
		if i == active {
			radio = "◉"
		}
		style := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#1C1917", Dark: "#E7E5E4"})
		if i == active {
			style = style.Foreground(lipgloss.AdaptiveColor{Light: "#374151", Dark: "#D1D5DB"})
		}
		lines = append(lines, fmt.Sprintf("%s %s %s", cursor, radio, style.Render(label)))
	}
	return strings.Join(lines, "\n") + "\n"
}

func (m model) selectedModules() []string {
	selected := []string{}
	for _, mod := range moduleOptions {
		if m.selected[mod] {
			selected = append(selected, string(mod))
		}
	}
	return selected
}

func (m model) selectedModuleLabels() []string {
	selected := []string{}
	for i, mod := range moduleOptions {
		if m.selected[mod] {
			selected = append(selected, moduleLabels[i])
		}
	}
	return selected
}

func formatFramework(value framework) string {
	switch value {
	case frameworkNext:
		return "Next.js"
	case frameworkExpo:
		return "Expo"
	default:
		return string(value)
	}
}

func main() {
	outputPath := flag.String("output", "", "path to write json output")
	flag.Parse()

	program := tea.NewProgram(newModel(), tea.WithAltScreen())
	finalModel, err := program.Run()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	m, ok := finalModel.(model)
	if !ok {
		fmt.Fprintln(os.Stderr, "invalid state")
		os.Exit(1)
	}

	if m.cancelled {
		return
	}

	if m.result == nil {
		fmt.Fprintln(os.Stderr, errors.New("no result"))
		os.Exit(1)
	}

	payload, err := json.Marshal(m.result)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	if outputPath == nil || strings.TrimSpace(*outputPath) == "" {
		fmt.Println(string(payload))
		return
	}

	if err := os.WriteFile(*outputPath, payload, 0o644); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
