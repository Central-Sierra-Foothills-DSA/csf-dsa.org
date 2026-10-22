# Contributing

Anyone in the chapter can improve this site, with or without an AI assistant.
Changes land through pull requests on GitHub.

## Quick path (no local setup)

1. Open the file you want to change on GitHub and click the pencil icon.
2. Make your edit and choose "Create a new branch and start a pull request."
3. A maintainer reviews and merges. The site redeploys automatically.

Good candidates for this: `src/data/site.json`, `src/data/branches.json`,
`src/data/working-groups.json`, `src/data/resources.json`, and the campaign
Markdown files in `src/content/campaigns/`.

## With an AI agent

Point your agent (Claude Code, Cursor, Copilot, etc.) at this repo. `CLAUDE.md`
tells it where things live and how to verify a change. Ask it to open a PR.
Review what it did before you submit.

## Local setup

```bash
git clone https://github.com/Central-Sierra-Foothills-DSA/csf-dsa.org.git
cd csf-dsa.org
npm install
npm run dev        # http://localhost:4321
```

`npm run build` must pass before you open a PR. CI checks this.

## Adding a campaign

Create `src/content/campaigns/<slug>.md`:

```markdown
---
title: "Campaign name"
summary: "One or two sentences shown on the card."
status: active        # or completed (hidden from the page)
order: 3              # lower numbers show first
links:
  - label: "Learn more"
    href: "https://example.org"
---

Body text in Markdown. Keep it to what a new member needs to know and how to get involved.
```

## Events

Events are not edited here. Add them in Solidarity Tech and they appear on the site
the next time it is built and published.

## Review and merge

Maintainers in the chapter's tech group review PRs. Content changes need one approval.
Anything touching deploy configuration or `scripts/` needs a maintainer who understands it.
