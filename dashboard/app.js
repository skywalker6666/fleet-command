const dataFiles = {
  projects: "./data/projects.json",
  roadmap: "./data/roadmap.json",
  checks: "./data/checks.json",
  releases: "./data/releases.json",
};

const statusText = {
  healthy: "Healthy",
  watch: "Watch",
  pass: "Pass",
  fail: "Fail",
  active: "Active",
  planned: "Planned",
  blocked: "Blocked",
  next: "Next",
  done: "Done",
};

function qs(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function badge(value) {
  const text = statusText[value] || value;
  return `<span class="badge ${escapeHtml(value)}">${escapeHtml(text)}</span>`;
}

function renderLinks(links) {
  return Object.entries(links || {})
    .map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`)
    .join("");
}

function renderProjects(projects) {
  qs("projectGrid").innerHTML = projects
    .map(
      (project) => `
        <article class="project-card">
          <div class="badge-row">
            ${badge(project.health)}
            <span class="badge">${escapeHtml(project.stage)}</span>
          </div>
          <div>
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.role)}</p>
          </div>
          <p>${escapeHtml(project.focus)}</p>
          <div class="stack-list">
            ${(project.stack || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
          <div class="link-row">${renderLinks(project.links)}</div>
        </article>
      `
    )
    .join("");
}

function renderRoadmap(horizons) {
  qs("roadmapGrid").innerHTML = horizons
    .map(
      (horizon) => `
        <article class="roadmap-column">
          <div class="roadmap-head">
            <div class="badge-row">
              <span class="badge">${escapeHtml(horizon.name)}</span>
              ${badge(horizon.status)}
            </div>
            <h3>${escapeHtml(horizon.theme)}</h3>
            <div class="progress-track" role="progressbar" aria-label="${escapeHtml(horizon.theme)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(horizon.progress) || 0}">
              <div class="progress-fill" style="width: ${Number(horizon.progress) || 0}%"></div>
            </div>
          </div>
          <ul class="roadmap-items">
            ${(horizon.items || [])
              .map(
                (item) => `
                  <li>
                    <span class="workstream">${escapeHtml(item.workstream)}</span>
                    <span class="deliverable">${escapeHtml(item.deliverable)} ${badge(item.status)}</span>
                  </li>
                `
              )
              .join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function renderActions(actions) {
  qs("actionQueue").innerHTML = actions
    .map(
      (action) => `
        <article class="action-item">
          <div>
            <span class="badge ${escapeHtml(action.status)}">${escapeHtml(action.priority)}</span>
          </div>
          <div>
            <h3>${escapeHtml(action.title)}</h3>
            <p><strong>${escapeHtml(action.owner)}</strong>: ${escapeHtml(action.nextStep)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderChecks(checks) {
  qs("checksList").innerHTML = checks
    .map(
      (check) => `
        <article class="check-item">
          <div>
            <h3>${escapeHtml(check.label)}</h3>
            <p>${escapeHtml(check.lastRun)} | <a href="${escapeHtml(check.evidence)}">Evidence</a></p>
          </div>
          ${badge(check.status)}
        </article>
      `
    )
    .join("");
}

function renderReleases(releases) {
  qs("releaseList").innerHTML = releases
    .map(
      (release) => `
        <article class="release-item">
          <h3>${escapeHtml(release.title)}</h3>
          <p>${escapeHtml(release.date)} | ${escapeHtml(release.summary)}</p>
          <div class="link-row">
            <a href="${escapeHtml(release.evidence)}">Evidence folder</a>
            ${(release.prs || [])
              .map((pr) => `<a href="${escapeHtml(pr.url)}">${escapeHtml(pr.repo)} #${escapeHtml(pr.number)}</a>`)
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json();
}

async function boot() {
  const [projects, roadmap, checks, releases] = await Promise.all(
    Object.values(dataFiles).map((path) => loadJson(path))
  );

  qs("workspaceName").textContent = projects.workspace.name;
  qs("workspaceMeta").textContent = `Updated ${projects.updatedAt}`;
  qs("overallStatus").textContent = statusText[checks.summary.status] || checks.summary.status;
  qs("overallHeadline").textContent = checks.summary.headline;
  qs("lastSmoke").textContent = checks.summary.lastProductionSmoke;

  renderProjects(projects.projects);
  renderRoadmap(roadmap.horizons);
  renderActions(checks.actionQueue);
  renderChecks(checks.healthChecks);
  renderReleases(releases.releases);
}

boot().catch((error) => {
  console.error(error);
  qs("loadError").hidden = false;
});
