import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from render_workspace_assets import render_workspace_assets


class RenderWorkspaceAssetsTest(unittest.TestCase):
    def _write_manifest(self, workspace: Path) -> Path:
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
            "policies": [
                {
                    "id": "python-package-management",
                    "title": "Python package management",
                    "rule": "Use uv for Python dependency management and Python command execution across the workspace.",
                }
            ],
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
        return manifest_path

    def test_renders_repo_context_and_rgignore_from_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            manifest_path = self._write_manifest(workspace)

            render_workspace_assets(manifest_path)

            api_context = (workspace / "cardsense-api" / "WORKSPACE_CONTEXT.generated.md").read_text(encoding="utf-8")
            self.assertIn("Recommendation API", api_context)
            self.assertIn("mvn test", api_context)
            self.assertIn("Use uv for Python dependency management", api_context)
            self.assertIn("feat/fix/chore/wip", api_context)
            self.assertIn("Before finishing work, follow the completion flow in `fleet-command/AGENTS.md`", api_context)

            extractor_context = (workspace / "cardsense-extractor" / "WORKSPACE_CONTEXT.generated.md").read_text(encoding="utf-8")
            self.assertIn("Extraction pipeline", extractor_context)
            self.assertIn("uv run pytest", extractor_context)
            self.assertIn("Use uv for Python dependency management", extractor_context)
            self.assertIn("feat/fix/chore/wip", extractor_context)
            self.assertIn("Before finishing work, follow the completion flow in `fleet-command/AGENTS.md`", extractor_context)

            rgignore = (workspace / ".rgignore").read_text(encoding="utf-8")
            self.assertIn("**/.git/", rgignore)
            self.assertIn("**/node_modules/", rgignore)

    def test_check_mode_reports_drift_without_writing_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            manifest_path = self._write_manifest(workspace)

            is_clean = render_workspace_assets(manifest_path, check=True)

            self.assertFalse(is_clean)
            self.assertFalse((workspace / ".rgignore").exists())
            self.assertFalse((workspace / "cardsense-api" / "WORKSPACE_CONTEXT.generated.md").exists())


if __name__ == "__main__":
    unittest.main()
