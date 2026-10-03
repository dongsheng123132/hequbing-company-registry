import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute } from './core.js';
import { manifest, openapi, normalizeBase } from './contracts.js';
import { schemas } from './schema.js';
export const ROOT = fileURLToPath(new URL('..', import.meta.url));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export function renderCatalog(catalog, basePath = '/observe') {
  const b = normalizeBase(basePath);
  const categories = [...new Set(catalog.records.flatMap(({company:c}) => c.offerings.map((o) => o.category)))];
  const labels = { 'power-cords':'电源线', 'international-logistics':'国际物流', 'cable-harnesses':'定制线束' };
  const cards = catalog.records.map(({company:c,version}) => `<article class="company" data-company-id="${esc(c.id)}">
    <div class="company-top"><span class="tag">来源已记录 · 待独立核验</span><span class="muted">版本 ${version}</span></div>
    <h2>${esc(c.name)}</h2><p class="legal">${esc(c.legalName || '法律主体待确认')}</p><p>${esc(c.summary)}</p>
    <div class="offerings">${c.offerings.map((o)=>`<section><h3>${esc(o.title)}</h3>${o.route ? `<p class="route">${esc(o.route.originCountry)} / ${esc(o.route.originCity || '待确认')} → ${esc(o.route.destinationCountry)} / ${esc(o.route.destinationCity || '待确认')} · ${esc(o.route.mode)}</p>` : ''}<p>${esc(o.description)}</p><details><summary>询价需要哪些信息</summary><ul>${o.inquiryFields.map((f)=>`<li>${esc(f)}</li>`).join('')}</ul><a href="${esc(o.inquiryUrl)}" rel="noopener noreferrer" target="_blank" data-action-id="inquiry.external">前往企业原站确认报价 ↗</a><p class="muted">本站暂不接收订单；实际价格与条款由企业确认。</p></details></section>`).join('')}</div>
    <details><summary>查看来源与待确认事项</summary><ul>${c.evidence.map((e)=>`<li><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.url)}</a> · ${esc(e.observedAt)}<p>${esc(e.note)}</p></li>`).join('')}</ul><ul>${c.unknowns.map((u)=>`<li>${esc(u)}</li>`).join('')}</ul></details>
    <a class="data-link" href="companies/${esc(c.id)}.json" data-action-id="company.get">读取完整 JSON →</a>
  </article>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><base href="${b}/"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI 品牌认知观察 · 贺去病</title><style>
  :root{color-scheme:light;--ink:#17332d;--muted:#62726d;--line:#dbe3dc;--accent:#276b51}*{box-sizing:border-box}body{margin:0;background:#f6f7f2;color:var(--ink);font:16px/1.7 system-ui,"Microsoft YaHei",sans-serif}a{color:var(--accent);overflow-wrap:anywhere}header,main,footer{max-width:1120px;margin:auto;padding:28px}nav{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:0 0 20px}.wordmark{font-weight:700;letter-spacing:.12em}.kicker{font-size:13px;letter-spacing:.14em;color:var(--accent);margin-top:44px}h1{font-size:clamp(30px,5vw,52px);line-height:1.25;margin:14px 0}header>p{max-width:690px;color:var(--muted)}.actions{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.button{padding:10px 18px;border:1px solid var(--accent);border-radius:8px;text-decoration:none}.primary{background:var(--ink);color:white}.notice{border-left:3px solid #baa563;padding:10px 16px;background:#f1eee1;font-size:14px}.toolbar{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}input,select{font:inherit;padding:12px;border:1px solid var(--line);border-radius:8px;background:white}input{flex:1;min-width:180px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.company{background:white;border:1px solid var(--line);border-radius:14px;padding:26px;min-width:0}.company-top{display:flex;justify-content:space-between;gap:10px;font-size:12px}.tag{background:#e9f0e9;padding:3px 9px;border-radius:20px}h2{font-size:26px;margin:18px 0 3px}.legal,.muted{color:var(--muted);font-size:13px}.offerings section{border-top:1px solid var(--line);padding:14px 0}.offerings p{font-size:14px}h3{font-size:17px;margin:0}.route{font-weight:600}details{font-size:14px;margin:12px 0}summary{cursor:pointer;color:var(--accent)}.data-link{display:inline-block;margin-top:14px}.machine{margin-top:34px;border:1px solid var(--line);border-radius:12px;padding:24px}.machine code{overflow-wrap:anywhere}footer{color:var(--muted);font-size:13px;border-top:1px solid var(--line)}[hidden]{display:none!important}@media(max-width:760px){header,main,footer{padding:20px}.grid{grid-template-columns:1fr}.company{padding:20px}nav{font-size:14px}h1{max-width:13em}}
  </style></head><body><header><nav><span class="wordmark">贺去病</span><span>开放企业资料 · 由 AI 协作维护</span></nav><p class="kicker">AI 品牌认知观察 / OPEN COMPANY DATA</p><h1>让企业资料，<br>成为 AI 可以查证的事实。</h1><p>从电源线工厂与菲律宾专线开始。企业的 AI 提交资料、补充证据、持续更新；买方的 AI 按实际需求查询。</p><div class="actions"><a class="button primary" href="SKILL.md" data-action-id="skill.read">把贡献 SKILL 交给你的 AI</a><a class="button" href="catalog.json" data-action-id="catalog.export">下载企业数据</a><a class="button" href="openapi.json">API 契约</a></div><div class="notice">${esc(catalog.notice)} 当前 ${catalog.records.length} 家企业，按 ID 排列。后续认知榜单使用独立采样。</div></header>
  <main><div class="toolbar"><input id="search" aria-label="搜索企业名称或域名" placeholder="搜索企业名称或域名" data-action-id="company.search"><select id="category" aria-label="业务类别"><option value="">全部业务</option>${categories.map((c)=>`<option value="${esc(c)}">${esc(labels[c]||c)}</option>`).join('')}</select></div><p id="count" class="muted" aria-live="polite">${catalog.records.length} 家企业</p><div class="grid">${cards}</div><p id="empty" hidden>暂未收录匹配企业。可以让你的 AI 提交有来源的资料。</p><section class="machine"><h3>一个入口，持续贡献</h3><p>把当前页面下的 <a href="SKILL.md">SKILL.md</a> 交给具备 HTTP 工具的 AI。按契约查重、校验、提交，获得可查询的处理编号。</p><p class="muted">投稿 API 需要维护者发放的独立令牌。纯静态预览可下载 <a href="examples/proposal.json">投稿示例</a>；在线投稿由配套服务处理。</p><p><a href="manifest.json">能力清单</a> · <a href="schemas/proposal.json">投稿规则</a> · <a href="examples/inquiry.json">询价草稿示例</a></p></section></main><footer>数据修订 ${catalog.revision} · 公开资料与私有询价分开保存 · <a href="https://creativecommons.org/licenses/by/4.0/">公开企业资料 CC BY 4.0</a></footer>
  <script type="application/json" id="company-data">${JSON.stringify(catalog.records.map(r=>r.company)).replace(/</g,'\\u003c')}</script>
  <script type="module">import {matchesCompany} from '${b}/search.js';const records=new Map(JSON.parse(document.querySelector('#company-data').textContent).map(c=>[c.id,c]));const search=document.querySelector('#search'),category=document.querySelector('#category');function filter(){let n=0;document.querySelectorAll('.company').forEach(c=>{c.hidden=!matchesCompany(records.get(c.dataset.companyId),{q:search.value,category:category.value});if(!c.hidden)n++});document.querySelector('#count').textContent=n+' 家企业';document.querySelector('#empty').hidden=n>0}search.addEventListener('input',filter);category.addEventListener('change',filter);</script></body></html>`;
}
export async function publicFiles(store, basePath = '/observe', transport = 'http') {
  const catalog = await execute(store, 'catalog.export');
  const files = new Map();
  const json = (path, value) => files.set(path, `${JSON.stringify(value, null, 2)}\n`);
  files.set('index.html', renderCatalog(catalog, basePath));
  files.set('SKILL.md', await readFile(resolve(ROOT, 'skills/contribute/SKILL.md'), 'utf8'));
  files.set('search.js', await readFile(resolve(ROOT, 'src/search.js'), 'utf8'));
  files.set('DATA-LICENSE.md', await readFile(resolve(ROOT, 'data/LICENSE.md'), 'utf8'));
  json('manifest.json', manifest(basePath, transport)); json('openapi.json', openapi(basePath)); json('catalog.json', catalog);
  for (const [name, schema] of Object.entries(schemas)) json(`schemas/${name}.json`, { $schema: 'https://json-schema.org/draft/2020-12/schema', ...schema });
  for (const record of catalog.records) json(`companies/${record.company.id}.json`, record);
  for (const name of ['proposal', 'inquiry', 'search-ph']) files.set(`examples/${name}.json`, await readFile(resolve(ROOT, `examples/${name}.json`), 'utf8'));
  if (transport === 'github') {
    files.set('index.html', files.get('index.html').replace('投稿 API 需要维护者发放的独立令牌。纯静态预览可下载', '当前通过 <a href="https://github.com/dongsheng123132/hequbing-company-registry/issues/new?template=company.yml">GitHub 提交资料</a>；你的 AI 可以用自己的 GitHub 授权投稿。也可下载').replace('在线投稿由配套服务处理。', '维护者审核后更新公开快照。API 契约供自托管服务使用。'));
  }
  return files;
}
export async function build(store, { outDir = resolve(ROOT, 'dist'), basePath = '/observe', transport = 'github' } = {}) {
  const files = await publicFiles(store, basePath, transport);
  for (const [name, content] of files) { const path = join(outDir, name); await mkdir(resolve(path, '..'), { recursive: true }); await writeFile(path, content); }
  return { outDir, files: [...files.keys()] };
}
