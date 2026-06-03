<!--
## Sync Impact Report

**Version change**: (template) → 1.0.0
**Modified principles**: N/A (initial ratification)
**Added sections**: Core Principles, Tech Stack & Standards, Development Workflow, Governance
**Removed sections**: None
**Templates requiring updates**:
  - ✅ .specify/templates/plan-template.md — Constitution Check gates reference these principles
  - ✅ .specify/templates/spec-template.md — requirements align with Angular/Bootstrap/ESRI MCP constraints
  - ✅ .specify/templates/tasks-template.md — task phases reflect Angular module setup, ESRI MCP wiring, Bootstrap theming
  - ⚠ .specify/templates/commands/ — no command templates found at expected path; no changes needed
**Deferred TODOs**: None
-->

# ESRI MCP Constitution

## Core Principles

### I. Angular Component Architecture

All UI MUST be built as Angular components following the single-responsibility principle.
Each component MUST encapsulate its own template, styles, and logic with no direct DOM
manipulation outside of Angular lifecycle hooks. Modules MUST be organized by feature
domain (e.g., map, auth, shared). Lazy loading MUST be applied to all non-critical feature
modules. Components MUST communicate via @Input/@Output bindings or injectable services;
direct component-to-component references across feature boundaries are prohibited.

### II. Bootstrap-First UI

All layout and styling MUST use Bootstrap utility classes and components as the primary
styling mechanism. Custom CSS MUST be scoped to component style files and introduced only
when Bootstrap cannot satisfy the requirement. The Bootstrap theme MUST be configured
centrally via SCSS variables; ad-hoc color/spacing overrides in component files are
prohibited. Responsive breakpoints MUST follow Bootstrap's grid system (xs/sm/md/lg/xl/xxl).

### III. ESRI MCP Integration

All geospatial operations (map rendering, feature queries, spatial analysis, geocoding)
MUST be performed through the ESRI Model Context Protocol (MCP) client. Direct calls to
ArcGIS REST APIs or the ArcGIS Maps SDK bypassing the MCP layer are prohibited. Map
views MUST be managed as Angular services wrapping MCP sessions to ensure proper
lifecycle management (initialization, cleanup on component destroy). ESRI MCP tool
invocations MUST be typed using generated or hand-authored interface definitions; raw
`any` types for MCP responses are prohibited.

### IV. Test-First Development (NON-NEGOTIABLE)

Tests MUST be written before implementation for all new Angular services, components with
business logic, and ESRI MCP integration layers. The Red-Green-Refactor cycle is strictly
enforced: tests must fail first, then implementation makes them pass, then refactor.
Unit tests MUST use Jasmine/Karma (or Jest if configured). Integration tests covering
MCP interactions MUST use real MCP sessions or contract-level fakes — mock-only MCP tests
are prohibited for integration test suites. Component tests MUST cover all @Input/@Output
contracts.

### V. Observability & Accessibility

All ESRI MCP tool calls MUST be wrapped with structured logging (timestamp, tool name,
parameters, response status). Angular error boundaries MUST capture and log unhandled
component errors. The UI MUST conform to WCAG 2.1 AA: all interactive elements require
accessible labels, map canvases MUST provide text alternatives or descriptions, keyboard
navigation MUST be tested for all workflows.

## Tech Stack & Standards

- **Framework**: Angular (latest stable LTS) — strict mode enabled, standalone components preferred
- **UI Library**: Bootstrap 5.x via `ng-bootstrap` or direct SCSS import; no jQuery dependency
- **Geospatial**: ESRI MCP client — version pinned and reviewed on each upgrade
- **Language**: TypeScript — strict null checks enforced, `noImplicitAny: true`
- **State Management**: Angular Signals or NgRx for shared state; component-local state via reactive forms or signals
- **Build**: Angular CLI with `ng build --configuration production`; bundle budgets enforced
- **Linting**: ESLint with Angular schematic rules; Prettier for formatting
- **Package Manager**: npm with `package-lock.json` committed

## Development Workflow

- Feature branches MUST follow the naming convention `###-feature-name` (sequential numbering)
- All pull requests MUST include: passing tests, lint clean, no new TypeScript errors
- Constitution Check (plan-template gate) MUST be completed before implementation begins
- ESRI MCP dependency upgrades MUST include a regression test run against integration tests
- Secrets (API keys, MCP credentials) MUST never be committed; use environment files
  excluded from version control and documented in README
- Commits MUST be atomic and reference the feature branch; squash-merge to main preferred

## Governance

This constitution supersedes all other project conventions. Any deviation requires
explicit justification recorded in `plan.md` under the Complexity Tracking section.

**Amendment procedure**: Propose change in a PR modifying this file. The version MUST be
bumped according to semantic versioning (MAJOR/MINOR/PATCH). Affected templates and docs
MUST be updated in the same PR.

**Compliance review**: Every `plan.md` MUST include a Constitution Check section
confirming compliance with all five principles before Phase 0 research begins, and
re-checked after Phase 1 design.

**Version policy**: MAJOR = principle removed or redefined incompatibly; MINOR = new
principle or section added; PATCH = clarification or wording fix.

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
