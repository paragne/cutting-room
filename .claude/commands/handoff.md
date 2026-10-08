End the session.

1. Run `npm run check`. If it fails, say so and do not mark the task done.
2. Run `git status`. List anything uncommitted and why.
3. Rewrite docs/STATE.md (do not append). Keep it under 60 lines:
   - Current task: the next unfinished task.
   - Tasks: the remaining ordered list.
   - Done: one line per finished task.
   - Open decisions and known issues, current only. Drop resolved ones.
4. Append any architecture decision made this session to docs/DECISIONS.md, one line with the reason.
5. If this session touched UI, list exactly what I should open and check in the browser.
6. Commit the doc changes with `docs: update state`. Do not push.
7. Tell me in two lines what was done and what is next, then stop.
