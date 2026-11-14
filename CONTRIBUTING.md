# Contributing

Anyone in the chapter can improve this site, with or without an AI assistant.
Changes land through pull requests on GitHub.

## Quick path (no local setup)

1. Open the file you want to change on GitHub and click the pencil icon.
2. Make your edit and choose "Create a new branch and start a pull request."
3. A maintainer reviews and merges. The site redeploys automatically.

Good candidates for this: a branch's meeting details in `src/content/branches/`,
a campaign in `src/content/campaigns/`, a news item in `src/content/updates/`, or any
of the JSON files in `src/data/`. `CLAUDE.md` has a table of what lives where.

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

## Common changes

### Update your branch page

Edit `src/content/branches/<your-branch>.md`. The top block holds the facts (when and
where you meet, the Zoom note). The text below it is the description on the page.

### Post news or a win

Create `src/content/updates/2026-12-01-short-title.md`:

```markdown
---
title: "What happened, in a headline"
date: 2026-12-01
summary: "One or two sentences."
link: "/campaigns/deflock/"   # optional: a page on this site or a full URL
---
```

It appears on the home page and in the archive.

### Add a campaign or endorsement

Create `src/content/campaigns/<name>.md`:

```markdown
---
title: "Campaign name"
summary: "One or two sentences shown on the card."
kind: campaign            # or endorsement
status: active            # or completed (moves it to the archive)
order: 4                  # lower numbers show first
date: 2026-12-01          # optional: when it started or was endorsed
branches: ["auburn"]      # optional: branch pages it should appear on
eventKeywords: ["rent"]   # optional: words in event titles that relate to it
links:
  - label: "Learn more"
    href: "https://example.org"
---

Body text in Markdown. Keep it to what a new member needs to know and how to get involved.
```

### Add an allied organization

Add an entry to `src/data/partners.json`:

```json
[{ "name": "Organization name", "url": "https://example.org", "blurb": "One line on how we work together." }]
```

## Events

Events are not edited here. Add them in Solidarity Tech and they appear on the site
the next time it is built and published.

## Preview pages for pull requests

Every pull request can get its own copy of the site, so reviewers can click through
the change before it is merged:

```
https://central-sierra-foothills-dsa.github.io/csf-dsa.org/pr-preview/pr-<number>/
```

A bot comments on the pull request with the link. The preview has a banner at the top
saying which pull request it is, updates when new commits are pushed, and disappears
when the pull request is merged or closed.

- **Org members and collaborators** get a preview automatically.
- **Everyone else** gets one after a maintainer looks over the changes and adds the
  `preview` label. If new commits are pushed, the label comes off and a maintainer
  needs to look again. This is because a preview puts the pull request's content on
  the chapter's own web address.

If the bot says the preview could not be built, the site does not build with your
changes. The comment links to the log with the error.

## Review and merge

Maintainers in the chapter's tech group review PRs. Content changes need one approval.
Anything touching deploy configuration (`.github/workflows/`) or `scripts/` needs a
maintainer who understands it. Read the safety notes at the top of
`.github/workflows/deploy.yml` before changing that file.
