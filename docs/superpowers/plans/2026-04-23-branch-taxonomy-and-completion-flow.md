# Branch Taxonomy And Completion Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manifest-backed branch type taxonomy plus repo-local completion reminders, and document the official finish-work workflow in `fleet-command/AGENTS.md`.

**Architecture:** Extend the workspace manifest with a reusable branch type dictionary and completion workflow metadata. Update the renderer so every generated repo context file includes a short completion reminder that points back to `fleet-command/AGENTS.md`. Write the full authoritative workflow into `fleet-command/AGENTS.md`, then organize, commit, and push the current repo changes onto matching `chore/workspace-context-manifest` branches.

**Tech Stack:** Markdown, JSON manifest, Python 3 stdlib renderer and unittest, git

---

### Task 1: Add failing renderer tests for completion reminders

**Files:**
- Modify: `d:\Projects\cardsense-workspace\fleet-command\tests\test_render_workspace_assets.py`

- [ ] **Step 1: Write the failing test**

```python
self.assertIn("feat/fix/chore/wip", api_context)
self.assertIn("Before finishing work, follow the completion flow in fleet-command/AGENTS.md", api_context)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest discover -s fleet-command/tests -p test_render_workspace_assets.py -v`
Expected: FAIL because the renderer does not yet include branch taxonomy or completion reminders.

- [ ] **Step 3: Write minimal implementation**

```python
branch_types = manifest.get("branchTypes", [])
completion_flow = manifest.get("completionFlow", {})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest discover -s fleet-command/tests -p test_render_workspace_assets.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C fleet-command add tests/test_render_workspace_assets.py
git -C fleet-command commit -m "test: cover branch taxonomy completion reminders"
```

### Task 2: Add manifest-backed branch taxonomy and AGENTS completion workflow

**Files:**
- Modify: `d:\Projects\cardsense-workspace\fleet-command\workspace\workspace.manifest.json`
- Modify: `d:\Projects\cardsense-workspace\fleet-command\scripts\render_workspace_assets.py`
- Modify: `d:\Projects\cardsense-workspace\fleet-command\AGENTS.md`

- [ ] **Step 1: Add branch taxonomy and completion workflow metadata to the manifest**

```json
"branchTypes": [
  {"id": "feat", "description": "New user-visible capability"},
  {"id": "fix", "description": "Bug fix or regression repair"},
  {"id": "chore", "description": "Docs, config, generated files, workflow, maintenance, or non-behavior refactor"},
  {"id": "wip", "description": "Exploratory or intentionally incomplete work"}
],
"completionFlow": {
  "sourceDoc": "fleet-command/AGENTS.md",
  "summary": [
    "Run verification first.",
    "Update fleet-command when workflow, architecture, or workspace rules changed.",
    "Re-render workspace assets when manifest or generated context changed.",
    "Organize branches by repo + branch type + shared slug.",
    "Batch commit and batch push by repo."
  ]
}
```

- [ ] **Step 2: Extend the renderer**

Add a `## Completion Reminder` section that renders:
- the source doc
- branch type shorthand such as `feat/fix/chore/wip`
- the reminder that Python work uses `uv`

- [ ] **Step 3: Add the formal workflow to `fleet-command/AGENTS.md`**

Add a new section:
- `Branch Type Dictionary`
- `Completion Flow After Development`

It must define:
- branch type semantics
- same slug across repos for one cross-repo task
- verification first
- decide whether `fleet-command` needs updates
- rerun `render_workspace_assets.py` when relevant
- inspect repo statuses
- organize branches by `repo + branch type + slug`
- batch commit
- batch push

- [ ] **Step 4: Run render and verify**

Run: `python fleet-command/scripts/render_workspace_assets.py`
Expected: updated generated context files in all repos.

Run: `python fleet-command/scripts/render_workspace_assets.py --check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C fleet-command add AGENTS.md workspace/workspace.manifest.json scripts/render_workspace_assets.py
git -C fleet-command commit -m "docs: define branch taxonomy and completion flow"
```

### Task 3: Organize branches, batch commit, and push current work

**Files:**
- Modify: current tracked files across `fleet-command`, `cardsense-api`, `cardsense-extractor`, `cardsense-contracts`, `cardsense-web`

- [ ] **Step 1: Create matching branches**

Run:

```bash
git -C fleet-command checkout -b chore/workspace-context-manifest
git -C cardsense-api checkout -b chore/workspace-context-manifest
git -C cardsense-extractor checkout -b chore/workspace-context-manifest
git -C cardsense-contracts checkout -b chore/workspace-context-manifest
git -C cardsense-web checkout -b chore/workspace-context-manifest
```

Expected: each repo now on the same shared slug with `chore` type.

- [ ] **Step 2: Run fresh verification**

Run:

```bash
python -m unittest discover -s fleet-command/tests -p test_render_workspace_assets.py -v
python fleet-command/scripts/render_workspace_assets.py --check
```

Expected: PASS

- [ ] **Step 3: Batch commit by repo**

Run separate commits per repo with matching topic:

```bash
git -C fleet-command add AGENTS.md WORKSPACE_CONTEXT.generated.md docs/superpowers/plans/2026-04-23-workspace-context-manifest-and-ignore.md docs/superpowers/plans/2026-04-23-branch-taxonomy-and-completion-flow.md scripts tests workspace
git -C fleet-command commit -m "chore: add workspace context manifest workflow"

git -C cardsense-api add CLAUDE.md WORKSPACE_CONTEXT.generated.md
git -C cardsense-api commit -m "chore: adopt generated workspace context"

git -C cardsense-extractor add CLAUDE.md WORKSPACE_CONTEXT.generated.md
git -C cardsense-extractor commit -m "chore: adopt generated workspace context"

git -C cardsense-contracts add WORKSPACE_CONTEXT.generated.md
git -C cardsense-contracts commit -m "chore: add generated workspace context"

git -C cardsense-web add WORKSPACE_CONTEXT.generated.md
git -C cardsense-web commit -m "chore: add generated workspace context"
```

- [ ] **Step 4: Batch push by repo**

Run:

```bash
git -C fleet-command push -u origin chore/workspace-context-manifest
git -C cardsense-api push -u origin chore/workspace-context-manifest
git -C cardsense-extractor push -u origin chore/workspace-context-manifest
git -C cardsense-contracts push -u origin chore/workspace-context-manifest
git -C cardsense-web push -u origin chore/workspace-context-manifest
```

- [ ] **Step 5: Record resulting branch names and push status**

Report which repos were pushed successfully and note any repo-specific divergence or remote rejection.
