import { projects } from "./universe.js";
import { createEngine, project, shape } from "./engine.js";
const themes = {
  agents: { label: "Agent infrastructure", short: "Agents", color: "#a9eed6" },
  systems: { label: "Applied systems", short: "Systems", color: "#edaa75" },
  human: { label: "Human experiences", short: "Experiences", color: "#c0b0f0" },
  learning: { label: "Learning tools", short: "Learning", color: "#89bee8" },
  research: { label: "Research", short: "Research", color: "#ded6b7" },
};
const keys = Object.keys(themes),
  byId = new Map(projects.map((p) => [p.id, p]));
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let paused = motion.matches,
  selected = "repogym",
  filter = "all",
  query = "";
try {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (byId.has(hash)) selected = hash;
} catch {
  /* malformed links still show the collection */
}
const beacons = projects.map((p, i) => {
  const button = document.createElement("button");
  button.className = "beacon";
  button.dataset.id = p.id;
  button.setAttribute("aria-label", `Select ${p.name}`);
  button.style.setProperty("--signal", themes[p.district].color);
  const dot = document.createElement("i"),
    label = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  label.textContent = p.name;
  button.append(dot, label);
  button.addEventListener("click", () => select(p.id));
  document.querySelector("#beacons").append(button);
  return {
    button,
    p,
    u: (i + 0.35) / projects.length,
    v: 0.07 + (i % 7) * 0.13,
    group: keys.indexOf(p.district),
  };
});
const engine = createEngine(document.querySelector("#engine"), {
  reducedMotion: motion.matches,
  onUnavailable() {
    document.querySelector("#fallback").hidden = false;
    document.querySelector("#download").disabled = true;
    document.querySelector("#beacons").hidden = true;
  },
  onFrame(state) {
    document.querySelector("#download").disabled = false;
    document.querySelector("#beacons").hidden = false;
    for (const b of beacons) {
      const position = project(
        shape(b.u, b.v, b.group, state.forms),
        state.yaw,
        state.pitch,
        state.width,
        state.height,
      );
      b.button.style.left = `${position.x}px`;
      b.button.style.top = `${position.y}px`;
      b.button.style.opacity = String(0.5 + (0.5 * (position.depth + 2)) / 4);
    }
  },
});
function matches(p) {
  return (
    (filter === "all" || p.district === filter) &&
    `${p.name} ${p.id} ${p.description} ${p.language}`
      .toLowerCase()
      .includes(query)
  );
}
function select(id, { focus = false, updateHash = true } = {}) {
  const p = byId.get(id);
  if (!p) return;
  selected = id;
  document.querySelector("#selected-theme").textContent =
    themes[p.district].label.toUpperCase();
  document.querySelector("#selected-number").textContent =
    `${String(projects.indexOf(p) + 1).padStart(2, "0")} / ${projects.length}`;
  document.querySelector("#selected-name").textContent = p.name;
  document.querySelector("#selected-description").textContent = p.description;
  document.querySelector("#selected-source").href = p.url;
  document.querySelector("#selected-language").textContent =
    p.language.toUpperCase();
  document
    .querySelector(".selected-project")
    .style.setProperty("--mint", themes[p.district].color);
  for (const b of beacons) {
    b.button.dataset.selected = String(b.p.id === id);
    b.button.setAttribute("aria-pressed", String(b.p.id === id));
  }
  document
    .querySelectorAll(".project-row")
    .forEach((row) => (row.dataset.selected = String(row.dataset.id === id)));
  if (updateHash) history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  if (focus) {
    document
      .querySelector(".selected-project")
      .scrollIntoView({
        behavior: motion.matches ? "instant" : "smooth",
        block: "center",
      });
    document.querySelector("#selected-source").focus({ preventScroll: true });
  }
}
function renderIndex() {
  const shown = projects.filter(matches),
    list = document.querySelector("#project-list");
  list.replaceChildren();
  document.querySelector("#results").textContent = shown.length
    ? `${String(shown.length).padStart(2, "0")} projects${filter === "all" ? " across five fields" : ` in ${themes[filter].label.toLowerCase()}`}`
    : "No projects match. Try another name or choose All work.";
  for (const p of shown) {
    const row = document.createElement("article");
    row.className = "project-row";
    row.dataset.id = p.id;
    row.dataset.selected = String(p.id === selected);
    row.style.setProperty("--signal", themes[p.district].color);
    const number = document.createElement("span");
    number.className = "row-number";
    number.textContent = String(projects.indexOf(p) + 1).padStart(2, "0");
    const name = document.createElement("div");
    name.className = "row-name";
    const title = document.createElement("h3");
    title.textContent = p.name;
    const theme = document.createElement("span");
    theme.textContent = themes[p.district].label.toUpperCase();
    name.append(title, theme);
    const desc = document.createElement("p");
    desc.textContent = p.description;
    const language = document.createElement("span");
    language.className = "row-language";
    language.textContent = p.language;
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const locate = document.createElement("button");
    locate.textContent = "⊙";
    locate.setAttribute("aria-label", `Locate ${p.name} in the engine`);
    locate.addEventListener("click", () => select(p.id, { focus: true }));
    const source = document.createElement("a");
    source.href = p.url;
    source.textContent = "↗";
    source.setAttribute("aria-label", `${p.name} source on GitHub`);
    actions.append(locate, source);
    row.append(number, name, desc, language, actions);
    list.append(row);
  }
  for (const b of beacons) b.button.hidden = !matches(b.p);
  for (const id of ["previous", "next"])
    document.querySelector(`#${id}`).disabled = !shown.length;
  if (shown.length && !shown.some((p) => p.id === selected))
    select(shown[0].id, { updateHash: false });
}
for (const [key, label] of [
  ["all", "All work"],
  ...keys.map((k) => [k, themes[k].short]),
]) {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.theme = key;
  b.setAttribute("aria-pressed", String(key === "all"));
  b.addEventListener("click", () => {
    filter = key;
    document
      .querySelectorAll("[data-theme]")
      .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
    engine?.filter(keys.indexOf(key));
    renderIndex();
  });
  document.querySelector("#themes").append(b);
}
document.querySelector("#search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  renderIndex();
});
for (const [id, step] of [
  ["previous", -1],
  ["next", 1],
])
  document.querySelector(`#${id}`).addEventListener("click", () => {
    const shown = projects.filter(matches);
    if (!shown.length) return;
    select(
      shown[
        (shown.findIndex((p) => p.id === selected) + step + shown.length) %
          shown.length
      ].id,
    );
  });
function updateMotion() {
  const b = document.querySelector("#motion");
  b.setAttribute("aria-pressed", String(paused));
  b.setAttribute("aria-label", paused ? "Resume sculpture" : "Pause sculpture");
  b.textContent = paused ? "▷" : "Ⅱ";
  engine?.pause(paused);
}
document.querySelector("#motion").addEventListener("click", () => {
  paused = !paused;
  updateMotion();
});
motion.addEventListener("change", (e) => {
  paused = e.matches;
  engine?.reduce(e.matches);
  updateMotion();
});
document.querySelectorAll("[data-form]").forEach((b) =>
  b.addEventListener("click", () => {
    engine?.form(Number(b.dataset.form));
    document
      .querySelectorAll("[data-form]")
      .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
  }),
);
document
  .querySelector("#reset")
  .addEventListener("click", () => engine?.reset());
document.querySelector("#download").addEventListener("click", () => {
  if (!engine) return;
  const a = document.createElement("a");
  a.href = engine.snapshot();
  a.download = "shivam-gupta-possibility-engine.png";
  a.click();
});
window.addEventListener("hashchange", () => {
  try {
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId.has(id)) select(id, { updateHash: false });
  } catch {
    /* preserve the current selection */
  }
});
select(selected, { updateHash: false });
renderIndex();
updateMotion();
