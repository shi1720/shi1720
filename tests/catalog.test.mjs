import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projects } from "../atlas/projects.js";
import { projects as universe } from "../atlas/universe.js";

test("every public project has a unique stable identity and a source link in the Markdown index", () => {
  const index = readFileSync(
    new URL("../docs/projects.md", import.meta.url),
    "utf8",
  );
  assert.equal(new Set(projects.map((p) => p.id)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.name && project.description && project.language);
    assert.ok(
      ["agents", "systems", "human", "learning"].includes(project.district),
    );
    const url = new URL(project.url);
    assert.equal(url.origin, "https://github.com");
    assert.equal(url.pathname, `/shi1720/${project.id}`);
    assert.ok(
      index.includes(project.url),
      `Missing index entry: ${project.id}`,
    );
  }
});

test("all four districts have projects and the generated cover is accessible", () => {
  assert.equal(new Set(projects.map((p) => p.district)).size, 4);
  const svg = readFileSync(
    new URL("../assets/header.svg", import.meta.url),
    "utf8",
  );
  assert.match(svg, /aria-labelledby="title desc"/);
  assert.match(svg, new RegExp(`${projects.length} PUBLIC PROJECTS`));
  assert.doesNotMatch(svg, /<script|<foreignObject|https?:\/\/(?!www.w3.org)/);
});

test("the expanded collection links every source in its readable index and cover", () => {
  const index = readFileSync(
    new URL("../docs/universe.md", import.meta.url),
    "utf8",
  );
  const svg = readFileSync(
    new URL("../assets/engine.svg", import.meta.url),
    "utf8",
  );
  const page = readFileSync(
    new URL("../atlas/index.html", import.meta.url),
    "utf8",
  );
  assert.equal(new Set(universe.map((p) => p.id)).size, universe.length);
  assert.equal(new Set(universe.map((p) => p.district)).size, 5);
  for (const p of universe) {
    assert.equal(p.url, `https://github.com/shi1720/${p.id}`);
    assert.ok(index.includes(p.url), `Missing index entry: ${p.id}`);
    assert.ok(p.name && p.description && p.language);
  }
  assert.match(svg, /aria-labelledby="title desc"/);
  assert.ok(svg.includes(`${universe.length} PUBLIC PROJECTS`));
  assert.ok(page.includes(`${universe.length} projects`));
  assert.doesNotMatch(svg, /<script|<foreignObject|https?:\/\/(?!www.w3.org)/);
});
