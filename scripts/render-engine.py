"""Render the profile cover and public index from the curated source catalog."""
import html
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads((ROOT / "atlas/universe.js").read_text().split("export const projects = ", 1)[1].strip().rstrip(";"))
colors = ["#a9eed6", "#edaa75", "#c0b0f0", "#89bee8", "#ded6b7"]
elements = ['''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="620" viewBox="0 0 1440 620" role="img" aria-labelledby="title desc">
<title id="title">Shivam Gupta — The Possibility Engine</title>
<desc id="desc">Make possible real. A procedural sculpture accompanies 43 public source projects across five fields. Enter the interactive exhibit to reshape it and explore the work.</desc>
<defs><linearGradient id="fade"><stop stop-color="#090c10"/><stop offset="1" stop-color="#090c10" stop-opacity="0"/></linearGradient><clipPath id="bounds"><rect width="1440" height="620" rx="10"/></clipPath></defs>
<g clip-path="url(#bounds)"><rect width="1440" height="620" fill="#090c10"/>
<path d="M45 83H1395M45 555H1395" stroke="#ffffff" stroke-opacity=".14"/>
<g fill="#95a59d" font-family="monospace" font-size="11" letter-spacing="2"><text x="48" y="47">SHIVAM GUPTA / APPLIED AI &amp; PRODUCT</text><text x="1120" y="47">THE POSSIBILITY ENGINE</text></g>''']

def point(u, v):
    t, p = u*math.tau, v*math.tau
    radius = 1.4+.38*math.cos(3*t)
    tube = .17+.18*(.5+.5*math.sin(3*t))**2
    x,y,z = (radius+tube*math.cos(p))*math.cos(2*t), (radius+tube*math.cos(p))*math.sin(2*t), .65*math.sin(3*t)+tube*math.sin(p)
    yaw, pitch = .43, -.42
    rx, rz = x*math.cos(yaw)-z*math.sin(yaw), x*math.sin(yaw)+z*math.cos(yaw)
    ry, depth = y*math.cos(pitch)-rz*math.sin(pitch), y*math.sin(pitch)+rz*math.cos(pitch)
    scale = 640/(5-depth)
    return 1060+rx*scale, 317-ry*scale

for group in range(5):
    for strand in range(47):
        coordinates = [point((group+j/120)/5, strand/47) for j in range(121)]
        path = "M"+"L".join(f"{x:.2f},{y:.2f}" for x,y in coordinates)
        elements.append(f'<path d="{path}" fill="none" stroke="{colors[group]}" stroke-width=".7" opacity=".5"/>')
for i, project in enumerate(projects):
    x,y=point((i+.35)/len(projects),.07+(i%7)*.13)
    color=colors[["agents","systems","human","learning","research"].index(project["district"])]
    elements.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="3" fill="{color}"/><circle cx="{x:.2f}" cy="{y:.2f}" r="8" fill="none" stroke="{color}" opacity=".4"/>')
elements.append('''<rect x="0" y="84" width="670" height="470" fill="url(#fade)"/>
<g fill="#eeeae1" font-family="Arial,Helvetica,sans-serif" font-size="108" letter-spacing="-7"><text x="50" y="220">Make</text><text x="50" y="406">real<tspan fill="#edaa75">.</tspan></text></g>
<text x="46" y="316" fill="#a9eed6" font-family="Georgia,serif" font-style="italic" font-size="113" letter-spacing="-7">possible</text>
<text x="53" y="456" fill="#b4beb8" font-family="Arial,sans-serif" font-size="17">Useful systems. Thoughtful products. Inspectable work.</text>
<rect x="53" y="486" width="235" height="35" fill="#a9eed6"/><text x="70" y="508" fill="#101912" font-family="monospace" font-size="11" letter-spacing="1">ENTER THE ENGINE ↗</text>
<g font-family="monospace" font-size="10" letter-spacing="1.4" fill="#9aaba2"><text x="50" y="591">43 PUBLIC PROJECTS</text><text x="315" y="591">5 FIELDS OF INQUIRY</text><text x="890" y="591">48,000 PARTICLES / ALL CODE / OPEN SOURCE</text></g>
</g></svg>''')
(ROOT / "assets/engine.svg").write_text("\n".join(elements)+"\n")
lines = ["# The public collection", "", "43 original public source repositories, curated and verified on September 22, 2026. Themes are editorial groupings; they do not imply dependencies or production readiness. Private repositories, forks, account metadata and binary-only preview distribution are excluded.", "", "[Explore the Possibility Engine](https://shi1720.github.io/shi1720/).", ""]
for theme,label in [("agents","Agent infrastructure"),("systems","Applied systems"),("human","Human experiences"),("learning","Learning tools"),("research","Research")]:
    lines += ["## "+label, ""]
    for p in projects:
        if p["district"]==theme: lines += [f"- **[{p['name']}]({p['url']})** — {p['description']}"]
    lines += [""]
(ROOT / "docs/universe.md").write_text("\n".join(lines))
print(f"Rendered cover and index for {len(projects)} public projects.")
