
## Git workflow

**Never commit directly to `main`.** Always work on a feature branch.

Standard flow:
1. `git checkout -b <descriptive-branch-name>` BEFORE making any code changes
2. Commit work to the branch (atomically — one logical change per commit)
3. Push the branch: `git push -u origin <branch-name>`
4. Open a PR via `gh pr create` so changes can be reviewed before landing in main
5. Only merge to main via PR, never via direct push

Branch names: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.

The `/ship` skill handles steps 2–5 automatically. Invoke it when work is ready to land.

If a session starts with the working tree on `main`, create a branch *first* before
any edits. If the user explicitly asks for a direct-to-main commit (rare cases like
README typos), confirm before doing it.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
