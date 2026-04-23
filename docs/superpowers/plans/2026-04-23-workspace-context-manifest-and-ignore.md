# Workspace Context Manifest And Ignore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a versioned workspace manifest plus a small renderer that generates low-token repo context files and a workspace `.rgignore`.

**Architecture:** `fleet-command` becomes the source of truth for workspace metadata in a JSON manifest that can be parsed with Python stdlib only. A single renderer script will read the manifest, write `WORKSPACE_CONTEXT.generated.md` into each repo, and render the workspace root `.rgignore` from the same ignore list. Existing `CLAUDE.md` files will stay thin and only point to the generated context file.

**Tech Stack:** Python 3 stdlib (`json`, `pathlib`, `argparse`, `tempfile`, `unittest`), Markdown, ripgrep ignore rules

---

### Task 1: Add failing tests for manifest rendering

**Files:**
- Create: `d:\Projects\cardsense-workspace\fleet-command\tests\test_render_workspace_assets.py`
- Test: `d:\Projects\cardsense-workspace\fleet-command\tests\test_render_workspace_assets.py`

- [ ] **Step 1: Write the failing test**

```python
import json
import tempfile
import unittest
from pathlib import Path

from scripts.render_workspace_assets import render_workspace_assets


class RenderWorkspaceAssetsTest(unittest.TestCase):
    def test_renders_repo_context_and_rgignore_from_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            fleet_command = workspace / "fleet-command"
            manifest_dir = fleet_command / "workspace"
            manifest_dir.mkdir(parents=True)

            (workspace / "cardsense-api").mkdir()
            (workspace / "cardsense-extractor").mkdir()

            manifest = {
                "version": 1,
                "workspace": {
                    "name": "cardsense-workspace",
                    "rootRgignorePath": ".rgignore",
                },
                "ignore": {
                    "patterns": ["**/.git/", "**/.worktrees/", "**/node_modules/"],
                },
                "repos": [
                    {
                        "name": "cardsense-api",
                        "path": "cardsense-api",
                        "purpose": "Recommendation API",
                        "role": "runtime",
                        "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
                        "keyFiles": ["README.md", "CLAUDE.md"],
                        "commands": {
                            "verify": ["mvn test"],
                        },
                    },
                    {
                        "name": "cardsense-extractor",
                        "path": "cardsense-extractor",
                        "purpose": "Extraction pipeline",
                        "role": "data-pipeline",
                        "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
                        "keyFiles": ["README.md", "VIBE_SPEC.md"],
                        "commands": {
                            "verify": ["uv run pytest"],
                        },
                    },
                ],
            }
            manifest_path = manifest_dir / "workspace.manifest.json"
            manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

            render_workspace_assets(manifest_path)

            api_context = (workspace / "cardsense-api" / "WORKSPACE_CONTEXT.generated.md").read_text(encoding="utf-8")
            self.assertIn("Recommendation API", api_context)
            self.assertIn("mvn test", api_context)

            extractor_context = (workspace / "cardsense-extractor" / "WORKSPACE_CONTEXT.generated.md").read_text(encoding="utf-8")
            self.assertIn("Extraction pipeline", extractor_context)
            self.assertIn("uv run pytest", extractor_context)

            rgignore = (workspace / ".rgignore").read_text(encoding="utf-8")
            self.assertIn("**/.git/", rgignore)
            self.assertIn("**/node_modules/", rgignore)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest fleet-command.tests.test_render_workspace_assets -v`
Expected: FAIL with `ModuleNotFoundError` for `scripts.render_workspace_assets` or import failure because the renderer does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```python
from pathlib import Path


def render_workspace_assets(manifest_path: Path) -> None:
    ...
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest fleet-command.tests.test_render_workspace_assets -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C fleet-command add tests/test_render_workspace_assets.py
git -C fleet-command commit -m "test: add workspace asset renderer coverage"
```

### Task 2: Add manifest and renderer implementation

**Files:**
- Create: `d:\Projects\cardsense-workspace\fleet-command\workspace\workspace.manifest.json`
- Create: `d:\Projects\cardsense-workspace\fleet-command\scripts\render_workspace_assets.py`
- Modify: `d:\Projects\cardsense-workspace\cardsense-api\CLAUDE.md`
- Modify: `d:\Projects\cardsense-workspace\cardsense-extractor\CLAUDE.md`

- [ ] **Step 1: Create the manifest**

```json
{
  "version": 1,
  "workspace": {
    "name": "cardsense-workspace",
    "sourceOfTruthRepo": "fleet-command",
    "rootRgignorePath": ".rgignore",
    "notes": [
      "Use generated repo context files before reading long status documents.",
      "Prefer repo README plus generated context over scanning the whole workspace."
    ]
  },
  "ignore": {
    "patterns": [
      "**/.git/",
      "**/.worktrees/",
      "**/node_modules/",
      "**/dist/",
      "**/.superpowers/brainstorm/",
      "**/.claude/skills/gstack/",
      "**/.uv-cache/",
      "**/.vite-*.log",
      "**/outputs/*.jsonl"
    ]
  },
  "repos": [
    {
      "name": "fleet-command",
      "path": "fleet-command",
      "purpose": "Workspace control plane and shared specs",
      "role": "control-plane",
      "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
      "keyFiles": ["README.md", "AGENTS.md", "CardSense-Overview.md", "CardSense-Status.md"],
      "commands": {
        "verify": ["rg --files fleet-command"]
      }
    },
    {
      "name": "cardsense-contracts",
      "path": "cardsense-contracts",
      "purpose": "Shared JSON schemas and taxonomies",
      "role": "contracts",
      "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
      "keyFiles": ["README.md", "VIBE_SPEC.md"],
      "commands": {
        "verify": ["rg -n \"TRAVEL\" promotion recommendation taxonomy"]
      }
    },
    {
      "name": "cardsense-extractor",
      "path": "cardsense-extractor",
      "purpose": "Promotion extraction and normalization pipeline",
      "role": "data-pipeline",
      "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
      "keyFiles": ["README.md", "VIBE_SPEC.md", "skills/cardsense-bank-promo-review/SKILL.md"],
      "commands": {
        "verify": ["uv run pytest", "uv run python jobs/refresh_and_deploy.py --help"]
      }
    },
    {
      "name": "cardsense-api",
      "path": "cardsense-api",
      "purpose": "Deterministic recommendation API",
      "role": "runtime",
      "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
      "keyFiles": ["README.md", "VIBE_SPEC.md"],
      "commands": {
        "verify": ["mvn test"]
      }
    },
    {
      "name": "cardsense-web",
      "path": "cardsense-web",
      "purpose": "Frontend recommendation and calc UI",
      "role": "frontend",
      "generatedContextPath": "WORKSPACE_CONTEXT.generated.md",
      "keyFiles": ["README.md", "src/lib/taxonomy.ts"],
      "commands": {
        "verify": ["npm run build"]
      }
    }
  ]
}
```

- [ ] **Step 2: Implement the renderer**

```python
import argparse
import json
from pathlib import Path


def render_workspace_assets(manifest_path: Path) -> None:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    workspace_root = manifest_path.resolve().parents[2]

    for repo in manifest["repos"]:
        repo_root = workspace_root / repo["path"]
        context_path = repo_root / repo["generatedContextPath"]
        context_path.write_text(render_repo_context(manifest, repo), encoding="utf-8")

    rgignore_path = workspace_root / manifest["workspace"]["rootRgignorePath"]
    rgignore_path.write_text(render_rgignore(manifest["ignore"]["patterns"]), encoding="utf-8")
```

- [ ] **Step 3: Keep existing `CLAUDE.md` files thin but useful**

Add this block below the existing gstack section in both files:

```md
## Repository Context

Read `WORKSPACE_CONTEXT.generated.md` before scanning large project documents.
It is generated from `fleet-command/workspace/workspace.manifest.json` and is the low-token repo summary for this workspace.
```

- [ ] **Step 4: Run tests and a real render**

Run: `python -m unittest fleet-command.tests.test_render_workspace_assets -v`
Expected: PASS

Run: `python fleet-command/scripts/render_workspace_assets.py`
Expected: Creates or updates repo `WORKSPACE_CONTEXT.generated.md` files and `d:\Projects\cardsense-workspace\.rgignore` without errors.

- [ ] **Step 5: Commit**

```bash
git -C fleet-command add workspace/workspace.manifest.json scripts/render_workspace_assets.py docs/superpowers/plans/2026-04-23-workspace-context-manifest-and-ignore.md
git -C cardsense-api add CLAUDE.md WORKSPACE_CONTEXT.generated.md
git -C cardsense-extractor add CLAUDE.md WORKSPACE_CONTEXT.generated.md
git -C cardsense-contracts add WORKSPACE_CONTEXT.generated.md
git -C cardsense-web add WORKSPACE_CONTEXT.generated.md
git -C fleet-command commit -m "feat: add workspace manifest and renderer"
```

### Task 3: Verify generated assets and ignore behavior

**Files:**
- Modify: `d:\Projects\cardsense-workspace\.rgignore`
- Test: `d:\Projects\cardsense-workspace\fleet-command\tests\test_render_workspace_assets.py`

- [ ] **Step 1: Verify `.rgignore` contains the intended noise filters**

Run: `Get-Content d:\Projects\cardsense-workspace\.rgignore`
Expected: includes `.git`, `.worktrees`, `node_modules`, `.superpowers/brainstorm`, vendored gstack skills, build outputs, and transient logs.

- [ ] **Step 2: Verify ripgrep uses the new ignore file**

Run: `rg --files d:\Projects\cardsense-workspace`
Expected: output should no longer include files under `.worktrees`, `node_modules`, or `.superpowers/brainstorm`.

- [ ] **Step 3: Verify generated docs exist for each repo**

Run: `Get-ChildItem d:\Projects\cardsense-workspace\cardsense-*\WORKSPACE_CONTEXT.generated.md, d:\Projects\cardsense-workspace\fleet-command\WORKSPACE_CONTEXT.generated.md`
Expected: one generated context file per repo.

- [ ] **Step 4: Run focused verification commands**

Run: `python -m unittest fleet-command.tests.test_render_workspace_assets -v`
Expected: PASS

Run: `python fleet-command/scripts/render_workspace_assets.py --check`
Expected: PASS with no drift reported.

- [ ] **Step 5: Commit**

```bash
git -C fleet-command add tests/test_render_workspace_assets.py
git -C fleet-command commit -m "test: verify workspace manifest outputs"
```
