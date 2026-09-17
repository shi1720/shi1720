"""Render the profile's deterministic project-city cover. No external services."""
import json, math, pathlib, html
ROOT = pathlib.Path(__file__).resolve().parents[1]
projects = json.loads((ROOT / 'atlas/projects.js').read_text().split('=', 1)[1].strip().rstrip(';'))
colors = {'agents':'#81e9cd','systems':'#ffb16e','human':'#b6a0ff','learning':'#79bfff'}
centers = {'agents':(-155,-145),'systems':(170,-100),'human':(135,185),'learning':(-170,185)}
svg = ['''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="560" viewBox="0 0 1200 560" role="img" aria-labelledby="title desc">
<title id="title">Shivam Gupta: The Working Atlas</title><desc id="desc">An illustrated city of 29 public projects across agent infrastructure, applied AI, human experiences and learning tools. Open the interactive atlas to explore the source.</desc>
<defs><radialGradient id="glow"><stop stop-color="#15352e"/><stop offset="1" stop-color="#070d12"/></radialGradient><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#81e9cd" stroke-opacity=".045"/></pattern></defs>
<rect width="1200" height="560" fill="#070d12"/><rect x="365" y="0" width="835" height="560" fill="url(#glow)"/><rect width="1200" height="560" fill="url(#grid)"/>
<style>.signal{stroke-dasharray:7 54;animation:flow 18s linear infinite}@keyframes flow{to{stroke-dashoffset:-610}}@media(prefers-reduced-motion:reduce){.signal{animation:none}}</style>''']
def seed(text):
    result=7
    for c in text: result=(result*31+ord(c))&0xffffffff
    return result
def project(x,y,z):
    a=.55;rx=x*math.cos(a)-z*math.sin(a);depth=x*math.sin(a)+z*math.cos(a)
    return 828+rx*.83, 305+(depth*.53-y*.85)*.83

def path(points,stroke,fill='none',width=.7,close=False,extra=''):
    coords=' '.join(('M' if i==0 else 'L')+f'{x:.1f},{y:.1f}' for i,(x,y) in enumerate(points))
    svg.append(f'<path d="{coords}{"Z" if close else ""}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" {extra}/>')
for radius in [325,355,380]:
    path([project(math.cos(t)*radius,-8,math.sin(t)*radius) for t in [i*math.tau/100 for i in range(101)]], '#29443e')
path([project(math.cos(i*math.tau/100)*355,-8,math.sin(i*math.tau/100)*355) for i in range(101)],'#81e9cd',extra='class="signal" opacity=".5"')
for key,(x,z) in centers.items():
    path([project(0,0,0),project(x,0,z)],colors[key]+'60')
    radius=135 if key=='systems' else 110
    path([project(x+math.cos(i*math.tau/70)*radius,0,z+math.sin(i*math.tau/70)*radius) for i in range(71)],colors[key]+'40')
nodes=[]
for p in projects:
    peers=[a for a in projects if a['district']==p['district']];i=peers.index(p);cols=4 if len(peers)>9 else 3
    cx,cz=centers[p['district']];x=cx+(i%cols-(cols-1)/2)*60;z=cz+(i//cols-(math.ceil(len(peers)/cols)-1)/2)*61
    nodes.append((x,z,36+seed(p['id'])%95,14+seed(p['id'])%9,colors[p['district']]))
for x,z,height,size,color in sorted(nodes,key=lambda n:n[0]*math.sin(.55)+n[1]*math.cos(.55),reverse=True):
    a=[(x-size,0,z-size),(x+size,0,z-size),(x+size,0,z+size),(x-size,0,z+size)]
    b=[(px,height,pz) for px,_,pz in a]
    for i in [0,1,2,3]:
        j=(i+1)%4;path([project(*a[i]),project(*a[j]),project(*b[j]),project(*b[i])],color+'85','#0c1c24',close=True)
    path([project(*p) for p in b],color,color+'24',close=True)
    for level in range(12,height,12):
        for i,j in [(1,2),(2,3)]:path([project(a[i][0],level,a[i][2]),project(a[j][0],level,a[j][2])],color+'45',width=.6)
    x1,y1=project(x,height+10,z);path([project(x,height,z),(x1,y1)],color)
    svg.append(f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="1.7" fill="{color}"/>')
svg.append('''<g font-family="Arial, Helvetica, sans-serif"><text x="52" y="62" fill="#81e9cd" font-size="13" letter-spacing="2.5">APPLIED AI / PRODUCT ENGINEERING</text><text x="47" y="181" fill="#e8eff3" font-size="90" letter-spacing="-5">Shivam</text><text x="48" y="269" fill="#81e9cd" font-family="Georgia,serif" font-style="italic" font-size="98" letter-spacing="-4">Gupta.</text><text x="52" y="324" fill="#a4b7c2" font-size="20">From a useful question</text><text x="52" y="354" fill="#a4b7c2" font-size="20">to a working product.</text><path d="M52 397H340" stroke="#344951"/><text x="52" y="434" fill="#e8eff3" font-size="15">ENTER THE WORKING ATLAS</text><path d="M324 432l16-16m-16 0h16v16" fill="none" stroke="#81e9cd" stroke-width="1.6"/><text x="52" y="510" fill="#7f98a6" font-size="12" letter-spacing="1.5">29 PUBLIC PROJECTS · 4 DISTRICTS</text><text x="1148" y="510" text-anchor="end" fill="#7f98a6" font-size="12" letter-spacing="1">EXPLORE THE CODE BEHIND THE CITY ↗</text></g></svg>''')
(ROOT/'assets/header.svg').write_text('\n'.join(svg)+'\n')
print('Rendered assets/header.svg from', len(projects),'public projects')
