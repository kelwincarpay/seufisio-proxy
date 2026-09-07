# KSS configuration

Written by `/kss-init`. Edit by hand at any time; every skill re-reads this file.

The language of what the skills *print* is not here — it is the user-local
`~/.kss/preferences.md` (`conversation_language`), which never belongs to a repository.

```
features_root: docs/features
next_number: 1
base_branch: main
branch_prefix: "feat/"
domain_docs: []
layout_references: []
standards: [CLAUDE.md]
explorer_model: sonnet
auto_decide: true
execution: multi-agent
full_suite: ci
tracker: none
review_autopilot: fixes
docs_root: docs
docs_index: docs/README.md
docs_language: pt-BR
```

| Key | Meaning |
| --- | --- |
| `features_root` | Where feature folders live |
| `next_number` | Used only when greater than the highest existing `NNN` |
| `base_branch` | Branch PRs target |
| `branch_prefix` | Prepended to `NNN-slug` when creating the feature branch |
| `domain_docs` | Glossary and ADR locations |
| `layout_references` | Design exports, design-system docs — the only source of layout truth |
| `standards` | Files whose rules bind explorers and executors |
| `explorer_model` | Default model for read-only explorers |
| `auto_decide` | `false` = every decision is asked in the grill |
| `execution` | `multi-agent` or `single-session` |
| `full_suite` | `ci` or `local` |
| `tracker` | `none`, or a tracker to mirror tickets into |
| `review_autopilot` | `fixes` \| `all` \| `none` |
| `docs_root` / `docs_index` | Where `kss-docs-*` writes |
| `docs_language` | Language of the *content* of generated documents; empty = follow the conversation. Names, headings and identifiers stay English |
