"use strict";
const A = "/api";
async function q(u, o) {
  const r = await fetch(A + u, { headers: { "Content-Type": "application/json" }, ...o });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
const C = {
  texts: { list: s => q("/texts" + (s ? "?subject=" + encodeURIComponent(s) : "")), get: i => q("/texts/" + i), create: d => q("/texts", { method: "POST", body: JSON.stringify(d) }), update: (i, d) => q("/texts/" + i, { method: "PUT", body: JSON.stringify(d) }), delete: i => q("/texts/" + i, { method: "DELETE" }) },
  attempts: { create: d => q("/attempts", { method: "POST", body: JSON.stringify(d) }), history: i => q("/attempts/" + i) },
  mistakes: { stats: () => q("/mistakes/stats"), rankings: () => q("/mistakes/rankings"), clear: () => q("/mistakes", { method: "DELETE" }) }
};
const S = {};
function nav(p, s) { location.hash = "#" + p; if (s) Object.assign(S, s); }
function cu() { return location.hash.slice(1) || "/"; }
function sh(h) { document.getElementById("app").innerHTML = h; }
function ld() { return "<div class=ld>加载中...</div>"; }

function pH() {
  const sj = S.sj || "语文", sq = S.sq || "";
  if (!S.tx) { S.tx = null; C.texts.list(sj).then(d => { S.tx = d; sh(pH()); }); return ld(); }
  const f = S.tx.filter(t => t.title.includes(sq));
  let h = "<div class=hdr><h1 onclick=\"nav('/')\">📚 背书小能手</h1><nav><a onclick=\"nav('/ms')\">错题本</a><a onclick=\"nav('/ad')\">管理</a></nav></div>";
  h += "<div class=flex g2 mb4>" + ["语文","英语"].map(s => "<button class='tab " + (sj===s?"ta":"tb") + "' onclick=\"S.sj='" + s + "';S.tx=null;sh(pH())\">" + (s==="语文"?"🈁 语文":"🔤 英语") + "</button>").join("") + "</div>";
  h += "<input class='inp mb4' placeholder='🔍 搜索...' value='" + sq + "' oninput=\"S.sq=this.value;sh(pH())\">";
  if (f.length === 0) h += "<div class='ld tc'>📖<br>" + (sq ? "没有找到" : "还没有课文") + "</div>";
  else for (const t of f) {
    const pct = t.avg_score || 0;
    h += "<div class=card><div class='flex jsb ac mb2'><span class='s14 fw6'>" + t.title + "</span>" + (t.grade ? "<span class=f12>" + t.grade + "</span>" : "") + "</div>";
    h += "<div class='flex ac g3 mb3'><div class='f1 pb'><div class=pf style='width:" + pct + "%'></div></div><span class=f12 style='min-width:44px;text-align:right'>" + (pct ? Math.round(pct) + "分" : "未背") + "</span></div>";
    h += "<div class='flex g2'><button class='btn bp bs f1' onclick=\"S.ri=" + t.id + ";S.rt=null;nav('/r/" + t.id + "')\">开始背诵</button><button class='btn bgr bs' onclick=\"nav('/res/" + t.id + "')\">历史</button></div></div>";
  }
  return h;
}

function pR() {
  const m = cu().match(/\/r\/(\d+)/);
  if (!m) { nav("/"); return ld(); }
  const id = m[1];
  if (!S.rt || S.ri != id) { S.ri = id; S.rt = null; C.texts.get(id).then(d => { S.rt = d; S.sn = d.sentences || d.content.split("|").filter(s => s.trim()); S.ci = 0; S.rg = ""; S.rs = []; S.il = false; if (S.rn) try { S.rn.stop(); } catch(e) {} sh(pR()); }); return ld(); }
  const sn = S.sn, ci = S.ci || 0, rg = S.rg || "", rs = S.rs || [];
  let h = "<div class=hdr><span style='cursor:pointer;color:#2563eb;font-size:14px' onclick=\"nav('/')\">← 返回</span><span class='s14 fw6'>" + S.rt.title + "</span></div>";
  h += "<div class=sc><div class='f12 mb2'>第 " + (ci+1) + " / " + sn.length + " 句</div><div style='color:#4b5563;font-size:15px'>" + sn[ci] + "</div></div>";
  h += "<div class=rb><div class='f12 mb2' style='color:#60a5fa'>你背的：</div><div style='color:" + (rg?"#334155":"#93c5fd") + "'>" + (rg || "等待你说...") + "</div></div>";
  const pct = (rs.length + (rg?1:0)) / sn.length * 100;
  h += "<div class='flex ac g3 mb6'><div class='f1 pb'><div class=pf style='width:" + pct + "%'></div></div><span class=f12>" + (rs.length+(rg?1:0)) + "/" + sn.length + "</span></div>";
  h += "<div class='flex g3'>";
  if (S.il) h += "<button class='btn by f1' onclick='stR()'>⏸ 暂停</button>";
  else h += "<button class='btn bg f1' onclick='stR()'>🎤 开始</button>";
  if (rg) h += "<button class='btn bp' onclick='nxR()'>下一句 →</button>";
  if (rg) h += "<button class='btn bgr' onclick='fnR()'>完成</button>";
  h += "</div>";
  return h;
}
function stR() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert("请使用 Chrome 或 Edge"); return; }
  if (S.il) { try { S.rn?.stop(); } catch(e) {} S.il = false; sh(pR()); return; }
  const r = new SR();
  r.lang = S.rt?.subject_name === "英语" ? "en-US" : "zh-CN";
  r.continuous = true; r.interimResults = true;
  r.onresult = function(e) { let f = ""; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) f += e.results[i][0].transcript; if (f) { S.rg = (S.rg || "") + f; sh(pR()); } };
  r.onend = function() { S.il = false; sh(pR()); };
  r.start(); S.rn = r; S.il = true; S.st = Date.now(); sh(pR());
}
function nxR() { S.rs = [...(S.rs||[]), { spoken: S.rg || "" }]; S.rg = ""; if ((S.ci||0) < S.sn.length - 1) { S.ci++; sh(pR()); } else fnR(); }
async function fnR() {
  try { S.rn?.stop(); } catch(e) {}
  const du = S.st ? Math.round((Date.now() - S.st) / 1000) : 0;
  const sp = S.sn.map((_, i) => { const r = (S.rs||[])[i]; return r ? r.spoken : ""; });
  if ((S.rs||[]).length === (S.ci||0)) sp[S.ci||0] = S.rg || "";
  try { const d = await C.attempts.create({ text_id: Number(S.ri), spoken_sentences: sp, duration_sec: du }); S.lr = d; nav("/res/" + S.ri); } catch(e) { alert("保存失败"); }
}

function pRes() {
  const m = cu().match(/\/res\/(\d+)/);
  if (!m) { nav("/"); return ld(); }
  const id = m[1];
  setTimeout(async () => {
    try {
      const hist = await C.attempts.history(id);
      const lr = S.lr;
      let h = "<div class=hdr><span style='cursor:pointer;color:#2563eb;font-size:14px' onclick=\"nav('/')\">← 返回</span><span class='s14 fw6'>背诵结果</span></div>";
      if (lr) {
        const sc = lr.score, co = sc >= 90 ? "#16a34a" : sc >= 70 ? "#ca8a04" : "#dc2626";
        const msg = sc >= 90 ? "🌟 太棒了！继续加油" : sc >= 70 ? "💪 不错，还有进步空间" : "📖 再背一次吧";
        h += "<div class='tc mb8'><div style='font-size:60px;font-weight:700;color:" + co + "'>" + sc + "%</div><div class=f12>" + msg + "</div></div>";
        if (lr.results) for (let i = 0; i < lr.results.length; i++) {
          const r = lr.results[i];
          h += "<div class=card><div class='flex jsb ac mb2'><span class=f12>第 " + (i+1) + " 句</span><span class='bd " + (r.score===100?"bg2":"by2") + "'>" + r.score + "%</span></div><div class='flex fw' style='gap:2px'>";
          for (const q of r.matched) h += "<span class='" + (q.correct?"cg":"ce") + "'>" + (q.expected || q.actual) + "</span>";
          h += "</div>";
          if (r.errors.length > 0) { h += "<div class=ed>"; for (const e of r.errors) h += "<div>原文：<span class=gn>" + e.expected + "</span> → 你背的：<span class=rd>" + (e.actual || "(漏了)") + "</span></div>"; h += "</div>"; }
          h += "</div>";
        }
      }
      if (hist.length > 0) {
        h += "<div class=mt8><div class='f12 fw6 gy mb3'>历史记录</div>";
        for (const a of hist) { const co = a.score>=90?"#16a34a":a.score>=70?"#ca8a04":"#dc2626"; h += "<div class='card flex jsb ac' style='padding:10px 16px'><span class=f12>" + new Date(a.finished_at).toLocaleString("zh-CN") + "</span><span class='s14 fw6' style='color:" + co + "'>" + a.score + "%</span></div>"; }
        h += "</div>";
      }
      h += "<div class='flex g3 mt8'><button class='btn bp f1' onclick=\"S.rt=null;nav('/r/" + id + "')\">再背一次</button><button class='btn bgr f1' onclick=\"nav('/')\">返回首页</button><button class='btn bgr' onclick=\"nav('/ms')\">错题本</button></div>";
      sh(h);
    } catch(e) { sh("<div class=ld>加载失败</div>"); }
  }, 0);
  return ld();
}

function pMs() {
  setTimeout(async () => {
    try {
      const [s, r] = await Promise.all([C.mistakes.stats(), C.mistakes.rankings()]);
      let h = "<div class=hdr><h1>📊 错题分析</h1><a onclick=\"nav('/')\">← 返回</a></div>";
      h += "<div class='gr mb6'><div class='card tc'><div class='s20 fw6 bl'>" + (s.total_attempts||0) + "</div><div class=f12>总背诵次数</div></div><div class='card tc'><div class='s20 fw6 gn'>" + Math.round(s.avg_score||0) + "%</div><div class=f12>平均分</div></div><div class='card tc'><div class='s20 fw6 rd'>" + (s.total_mistake_types||0) + "</div><div class=f12>易错字种数</div></div></div>";
      if (r.length > 0) {
        h += "<div class=mb6><div class='f12 fw6 gy mb3'>🔴 高频错字排行榜</div>";
        for (let i = 0; i < Math.min(r.length, 10); i++) {
          const n = r[i];
          h += "<div class='card flex ac g3' style='padding:10px 14px'><span class=f12 style=width:16px>" + (i+1) + "</span><span style='font-size:18px;color:#dc2626;font-family:monospace'>" + n.character + "</span><div class=f1><div class='flex ac g2'><span class=f12>原文：</span><span class='f12' style=color:#475569>" + n.expected + "</span><span class=f12>→</span><span class='f12 rd'>你背成：" + n.actual_common + "</span></div><div class='f12 lg'>出自《" + n.text_title + "》· 错了 " + n.mistake_count + " 次</div></div></div>";
        }
        h += "</div>";
      }
      if (s.weakTexts?.length > 0) {
        h += "<div class=mb6><div class='f12 fw6 gy mb3'>⚠️ 需要加强的课文</div>";
        for (const t of s.weakTexts) { const co = t.avg_score>=90?"#16a34a":t.avg_score>=70?"#ca8a04":"#dc2626"; h += "<div class='card flex jsb ac' style='padding:10px 14px'><div><div class=s14>" + t.title + "</div><div class=f12>背诵 " + t.attempt_count + " 次</div></div><div class='flex ac g3'><span class='s14 fw6' style='color:" + co + "'>" + t.avg_score + "%</span><button class='btn bp bs' onclick=\"S.rt=null;nav('/r/" + t.id + "')\">再去背</button></div></div>"; }
        h += "</div>";
      }
      if (s.trend?.length > 0) {
        h += "<div class=mb6><div class='f12 fw6 gy mb3'>📈 近 7 天趋势</div><div class=card style='padding:20px'><div class='flex' style='height:100px;gap:4px;align-items:flex-end'>";
        for (const d of s.trend) { h += "<div class='f1 flex' style='height:100%;flex-direction:column;gap:2px;justify-content:flex-end;align-items:center'><span class=f12>" + d.avg_score + "</span><div style='width:90%;background:#60a5fa;border-radius:4px 4px 0 0;height:" + d.avg_score + "%;min-height:6px'></div><span class=f12>" + d.day.slice(5) + "</span></div>"; }
        h += "</div></div></div>";
      }
      h += "<button class='btn bs bw' style='color:#dc2626;border:1px solid #fecaca;background:#fff' onclick=\"if(confirm('确定清空所有错题？')){C.mistakes.clear();sh(pMs())}\">清空错题记录</button>";
      sh(h);
    } catch(e) { sh("<div class=ld>加载失败</div>"); }
  }, 0);
  return ld();
}

function pAd() {
  const a = sessionStorage.getItem("aa") === "1";
  if (!a) return '<div class=hdr><h1>📜 家长管理</h1></div><div class=\'tc\' style=\'padding-top:40px\'><input class=\'inp\' type=\'password\' placeholder=\'请输入密码\' id=\'ap\' style=\'width:200px;margin-bottom:12px\' onkeydown=\'if(event.key==="Enter")lAd()\'><br><button class=\'btn bp\' onclick=\'lAd()\'>确认</button></div>';
  lAd2();
  return ld();
}
function lAd() { const p = document.getElementById("ap")?.value; if (p === "123456") { sessionStorage.setItem("aa", "1"); sh(pAd()); } else alert("密码错误"); }
async function lAd2() {
  try {
    const t = await C.texts.list();
    let h = "<div class='flex jsb ac mb6'><h1 class=s20>📖 课文管理</h1><div class='flex g2'><button class='btn bp bs' onclick=\"nav('/an')\">＋ 新增</button><button class='btn bgr bs' onclick=\"sessionStorage.removeItem('aa');sh(pAd())\">退出</button></div></div>";
    if (t.length === 0) h += "<div class=ld>还没有课文</div>";
    else for (const x of t) h += "<div class='card flex jsb ac' style='padding:10px 14px'><div><div class=s14>" + (x.subject_emoji||"") + " " + (x.title||"") + "</div><div class='f12 lg mt2'>" + (x.source==="builtin"?"内置":"自定义") + "</div></div><div class='flex g2'><button class='btn bgr bs' onclick=\"S.ei=" + x.id + ";nav('/ae/" + x.id + "')\">编辑</button><button class='btn bgr bs' style='color:#dc2626' onclick=\"if(confirm('确定删除《" + x.title + "》？')){C.texts.delete(" + x.id + ").then(()=>sh(pAd()))}\">删除</button></div></div>";
    sh(h);
  } catch(e) { sh("<div class=ld>加载失败</div>"); }
}

function pAf() {
  const p = cu();
  const ed = p.includes("/ae");
  const id = ed ? p.split("/")[2] : null;
  setTimeout(async () => {
    let f = { subject_id: 1, title: "", content: "", source: "manual", grade: "", tags: "" };
    if (ed && id) try { const t = await C.texts.get(id); f = { subject_id: t.subject_id, title: t.title, content: t.content.replace(/\|/g, "\n"), source: t.source, grade: t.grade || "", tags: t.tags || "" }; } catch(e) {}
    const esc = s => s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
    let h = "<div class=hdr><span style='cursor:pointer;color:#2563eb;font-size:14px' onclick=\"nav('/ad')\">← 返回</span><span class='s14 fw6'>" + (ed ? "编辑课文" : "新增课文") + "</span></div>";
    h += "<div class=mb4><div class='f12 gy mb1'>科目</div><div class='flex g2' id='sb'><button class='tab " + (f.subject_id===1?"ta":"tb") + "' onclick=\"window._sf=1;document.querySelectorAll('#sb button').forEach((b,i)=>b.className='tab '+(i===0?'ta':'tb'))\">语文</button><button class='tab " + (f.subject_id===2?"ta":"tb") + "' onclick=\"window._sf=2;document.querySelectorAll('#sb button').forEach((b,i)=>b.className='tab '+(i===1?'ta':'tb'))\">英语</button></div></div>";
    h += "<div class=mb4><div class='f12 gy mb1'>标题</div><input class=inp id=ft value='" + esc(f.title) + "' placeholder='静夜思'></div>";
    h += "<div class='flex g3 mb4'><div class=f1><div class='f12 gy mb1'>年级</div><input class=inp id=fg value='" + esc(f.grade) + "' placeholder='一上'></div><div class=f1><div class='f12 gy mb1'>标签</div><input class=inp id=ftg value='" + esc(f.tags) + "' placeholder='逗号分隔'></div></div>";
    h += "<div class=mb4><div class='flex jsb ac mb1'><span class='f12 gy'>课文内容（每行一句）</span><button class='btn bgr bs' onclick='doO()'>📷 拍照导入</button></div><textarea class=ta id=fc placeholder='床前明月光'>" + esc(f.content) + "</textarea></div>";
    h += "<button class='btn bp bw' onclick=\"svF(" + (ed?"'"+id+"'":"null") + ")\">" + (ed?"保存修改":"添加课文") + "</button>";
    sh(h);
  }, 0);
  return ld();
}
window._sf = 1;
async function svF(id) {
  const t = document.getElementById("ft")?.value?.trim(), c = document.getElementById("fc")?.value?.trim();
  if (!t || !c) { alert("标题和内容不能为空"); return; }
  const d = { subject_id: window._sf || 1, title: t, content: c.split("\n").map(s=>s.trim()).filter(Boolean).join("|"), grade: document.getElementById("fg")?.value || "", tags: document.getElementById("ftg")?.value || "", source: "manual" };
  try { if (id) await C.texts.update(id, d); else await C.texts.create(d); nav("/ad"); } catch(e) { alert("保存失败"); }
}
async function doO() {
  const i = document.createElement("input"); i.type = "file"; i.accept = "image/*";
  i.onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const T = await import("https://unpkg.com/tesseract.js@5/dist/tesseract.esm.min.js"); const { data } = await T.recognize(f, window._sf===2?"eng":"chi_sim"); document.getElementById("fc").value = data.text; } catch(e) { alert("OCR 识别失败"); }
  };
  i.click();
}

function rt() {
  const p = cu();
  if (p === "/" || p === "") sh(pH());
  else if (p.startsWith("/r/")) sh(pR());
  else if (p.startsWith("/res/")) sh(pRes());
  else if (p === "/ms") sh(pMs());
  else if (p === "/ad") sh(pAd());
  else if (p === "/an") sh(pAf());
  else if (/^\/ae\/\d+$/.test(p)) sh(pAf());
  else sh(pH());
}
window.addEventListener("hashchange", rt);
window.addEventListener("load", () => { if (!location.hash) location.hash = "#/"; rt(); });
