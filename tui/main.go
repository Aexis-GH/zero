package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type step int

const (
	stepDirectory step = iota
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

var moduleOptions = []module{"neon", "clerk", "payload", "stripe"}

var frameworkOptions = []framework{frameworkNext, frameworkExpo}

var packageManagerOptions = []packageManager{"npm", "pnpm", "yarn", "bun"}

const (
	colorLight = "#E7E5E4"
	colorDark  = "#1C1917"
)

type config struct {
	Directory string   `json:"directory"`
	AppName   string   `json:"appName"`
	Domain    string   `json:"domain"`
	Framework string   `json:"framework"`
	Modules   []string `json:"modules"`
	Package   string   `json:"packageManager"`
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
	fg           lipgloss.Color
	muted        lipgloss.Color
	accent       lipgloss.Color
}

func newModel() model {
	fg := lipgloss.Color(colorDark)
	muted := lipgloss.Color(colorDark)
	accent := lipgloss.Color(colorDark)
	if lipgloss.HasDarkBackground() {
		fg = lipgloss.Color(colorLight)
		muted = lipgloss.Color(colorLight)
		accent = lipgloss.Color(colorLight)
	}

	dirInput := textinput.New()
	dirInput.Placeholder = "."
	dirInput.SetValue(".")
	dirInput.Focus()
	dirInput.CharLimit = 120

	nameInput := textinput.New()
	nameInput.Placeholder = "my-app"
	nameInput.CharLimit = 80

	domainInput := textinput.New()
	domainInput.Placeholder = "example.com"
	domainInput.CharLimit = 120

	return model{
		step:      stepDirectory,
		directory: dirInput,
		name:      nameInput,
		domain:    domainInput,
		selected:  map[module]bool{},
		fg:        fg,
		muted:     muted,
		accent:    accent,
	}
}

func (m model) Init() tea.Cmd {
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
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
		m.step = stepName
		m.name.Focus()
		return m, nil
	case stepName:
		value := strings.TrimSpace(m.name.Value())
		if value == "" {
			m.err = "App name is required."
			return m, nil
		}
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
		if m.moduleIdx < len(moduleOptions)-1 {
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
	if m.step == stepModules {
		selected := moduleOptions[m.moduleIdx]
		m.selected[selected] = !m.selected[selected]
	}
	return m, nil
}

func (m model) View() string {
	if m.cancelled {
		return ""
	}

	base := lipgloss.NewStyle().Foreground(m.fg)
	muted := lipgloss.NewStyle().Foreground(m.muted)
	accent := lipgloss.NewStyle().Foreground(m.accent)

	header := accent.Render("ZER0") + "  " + base.Render("Aexis Zero")
	divider := strings.Repeat("-", 42)

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
		if modules := m.selectedModules(); len(modules) > 0 {
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

func renderFrameworkOptions(active int) string {
	labels := []string{"Next.js", "Expo"}
	lines := make([]string, 0, len(labels))
	for i, label := range labels {
		cursor := " "
		if i == active {
			cursor = ">"
		}
		lines = append(lines, fmt.Sprintf("%s ( ) %s", cursor, label))
	}
	return strings.Join(lines, "\n") + "\n"
}

func renderModuleOptions(active int, selected map[module]bool) string {
	labels := []string{"Neon", "Clerk", "Payload", "Stripe"}
	lines := make([]string, 0, len(labels))
	for i, label := range labels {
		cursor := " "
		if i == active {
			cursor = ">"
		}
		mark := "[ ]"
		if selected[moduleOptions[i]] {
			mark = "[x]"
		}
		lines = append(lines, fmt.Sprintf("%s %s %s", cursor, mark, label))
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
			cursor = ">"
		}
		lines = append(lines, fmt.Sprintf("%s ( ) %s", cursor, action))
	}
	return strings.Join(lines, "\n")
}

func renderPackageManagerOptions(active int) string {
	labels := []string{"npm", "pnpm", "yarn", "bun"}
	lines := make([]string, 0, len(labels))
	for i, label := range labels {
		cursor := " "
		if i == active {
			cursor = ">"
		}
		lines = append(lines, fmt.Sprintf("%s ( ) %s", cursor, label))
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

	program := tea.NewProgram(newModel())
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
