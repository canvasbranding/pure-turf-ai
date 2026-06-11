import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════
   TOKENS
   ═══════════════════════════════════════════════════ */
const NAV = "#04143E";
const W1  = "#F2F2F5";
const W2  = "rgba(242,242,245,0.60)";
const W3  = "rgba(242,242,245,0.32)";
const BD  = "rgba(255,255,255,0.08)";
const BDA = "rgba(255,255,255,0.15)";
const GLASS_BG  = "rgba(10,12,18,0.62)";
const GLASS_BG2 = "rgba(10,12,18,0.52)";
const TILE_BG   = "rgba(255,255,255,0.05)";
const TILE_BG2  = "rgba(255,255,255,0.03)";
const FF = "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif";

/* ═══════════════════════════════════════════════════
   BRAND SVGs
   ═══════════════════════════════════════════════════ */
const LOGO_FULL = `<svg viewBox="0 0 619 88" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M149.352 66V18.4H181.584C185.573 18.4 188.452 19.284 190.22 21.052C191.988 22.7747 192.872 25.6533 192.872 29.688V38.392C192.872 42.4267 191.988 45.328 190.22 47.096C188.452 48.8187 185.573 49.68 181.584 49.68H158.056V66H149.352ZM158.056 43.016H178.388C180.609 43.016 182.128 42.6307 182.944 41.86C183.76 41.044 184.168 39.5253 184.168 37.304V31.048C184.168 28.8267 183.76 27.3307 182.944 26.56C182.128 25.744 180.609 25.336 178.388 25.336H158.056V43.016ZM221.046 66C216.694 66 213.498 64.98 211.458 62.94C209.418 60.9 208.398 57.704 208.398 53.352V18.4H217.102V51.72C217.102 54.2133 217.601 55.9813 218.598 57.024C219.641 58.0213 221.409 58.52 223.902 58.52H237.774C240.313 58.52 242.081 58.0213 243.078 57.024C244.076 56.0267 244.574 54.2587 244.574 51.72V18.4H253.278V53.352C253.278 57.704 252.258 60.9 250.218 62.94C248.178 64.98 244.982 66 240.63 66H221.046ZM316.616 66H306.892L294.448 48.184H279.76V66H271.056V18.4H303.288C307.277 18.4 310.156 19.284 311.924 21.052C313.692 22.7747 314.576 25.6533 314.576 29.688V36.352C314.576 40.3413 313.715 43.22 311.992 44.988C310.269 46.7107 307.436 47.5947 303.492 47.64L316.616 66ZM279.76 25.064V41.656H300.092C302.313 41.656 303.832 41.2707 304.648 40.5C305.464 39.684 305.872 38.1653 305.872 35.944V30.776C305.872 28.5547 305.464 27.0587 304.648 26.288C303.832 25.472 302.313 25.064 300.092 25.064H279.76ZM341.077 58.724H371.949V66H332.373V18.4H371.269V25.676H341.077V37.916H368.549V44.648H341.077V58.724Z" fill="currentColor"/><path d="M440.88 18.4V26.152H423.336V66H414.632V26.152H397.088V18.4H440.88ZM467.929 66C463.577 66 460.381 64.98 458.341 62.94C456.301 60.9 455.281 57.704 455.281 53.352V18.4H463.985V51.72C463.985 54.2133 464.484 55.9813 465.481 57.024C466.524 58.0213 468.292 58.52 470.785 58.52H484.657C487.196 58.52 488.964 58.0213 489.961 57.024C490.958 56.0267 491.457 54.2587 491.457 51.72V18.4H500.161V53.352C500.161 57.704 499.141 60.9 497.101 62.94C495.061 64.98 491.865 66 487.513 66H467.929ZM563.499 66H553.775L541.331 48.184H526.643V66H517.939V18.4H550.171C554.16 18.4 557.039 19.284 558.807 21.052C560.575 22.7747 561.459 25.6533 561.459 29.688V36.352C561.459 40.3413 560.598 43.22 558.875 44.988C557.152 46.7107 554.319 47.5947 550.375 47.64L563.499 66ZM526.643 25.064V41.656H546.975C549.196 41.656 550.715 41.2707 551.531 40.5C552.347 39.684 552.755 38.1653 552.755 35.944V30.776C552.755 28.5547 552.347 27.0587 551.531 26.288C550.715 25.472 549.196 25.064 546.975 25.064H526.643ZM617.472 26.016H587.96V39.548H614.752V46.756H587.96V66H579.256V18.4H617.472V26.016Z" fill="currentColor"/><path d="M69.8085 23.1353C65.2107 25.598 62.4881 30.5869 60.6134 35.4542V35.4542C59.421 35.4765 55.3065 34.6077 53.9474 34.5506C45.8984 34.2016 40.8438 37.7953 41.0037 43.0361C41.0231 43.673 40.9979 44.4307 41.5177 44.7992C42.1385 45.2392 43.2504 45.3048 43.6814 44.4436C44.0116 43.7837 43.0003 42.8423 43.0647 42.1072V42.1072C43.57 36.2188 52.1228 34.5828 59.9164 37.1472C59.3738 38.0608 49.8178 61.7285 44.4487 66.9615C43.6429 67.7475 42.5771 68.2036 41.5806 68.7804C41.3643 68.9057 41.2643 69.1391 41.3517 69.3733V69.3733C41.4672 69.6827 41.8471 69.8403 42.1294 69.6689C42.5226 69.4303 42.8234 69.2525 43.2779 69.0021C50.9993 64.7595 61.0868 38.0609 61.7758 37.5792C71.2919 39.6098 76.3117 35.1834 77.6533 33.5201C83.6472 26.0893 77.1102 19.2242 69.8085 23.1353ZM62.3508 36.0549C63.5718 32.0746 64.8728 28.3137 68.5417 25.4691C74.1329 21.1343 78.8365 23.875 79.1029 27.3269C79.517 32.6939 72.1533 39.2876 62.3508 36.0525V36.0549Z" fill="currentColor" stroke="currentColor" stroke-width="4"/><circle cx="58" cy="44" r="41.25" stroke="currentColor" stroke-width="5.5"/></svg>`;
const PT_MARK = `<svg viewBox="10 0 96 88" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M69.8085 23.1353C65.2107 25.598 62.4881 30.5869 60.6134 35.4542C59.421 35.4765 55.3065 34.6077 53.9474 34.5506C45.8984 34.2016 40.8438 37.7953 41.0037 43.0361C41.0231 43.673 40.9979 44.4307 41.5177 44.7992C42.1385 45.2392 43.2504 45.3048 43.6814 44.4436C44.0116 43.7837 43.0003 42.8423 43.0647 42.1072C43.57 36.2188 52.1228 34.5828 59.9164 37.1472C59.3738 38.0608 49.8178 61.7285 44.4487 66.9615C43.6429 67.7475 42.5771 68.2036 41.5806 68.7804C41.3643 68.9057 41.2643 69.1391 41.3517 69.3733C41.4672 69.6827 41.8471 69.8403 42.1294 69.6689C42.5226 69.4303 42.8234 69.2525 43.2779 69.0021C50.9993 64.7595 61.0868 38.0609 61.7758 37.5792C71.2919 39.6098 76.3117 35.1834 77.6533 33.5201C83.6472 26.0893 77.1102 19.2242 69.8085 23.1353ZM62.3508 36.0549C63.5718 32.0746 64.8728 28.3137 68.5417 25.4691C74.1329 21.1343 78.8365 23.875 79.1029 27.3269C79.517 32.6939 72.1533 39.2876 62.3508 36.0525V36.0549Z" fill="currentColor" stroke="currentColor" stroke-width="4"/><circle cx="58" cy="44" r="41.25" stroke="currentColor" stroke-width="5.5"/></svg>`;

/* ═══════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════ */
const ic = {
  pipeline: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v2.5l-5.5 5.5v5.5L10.5 20V12L4 6.5V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  gads:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="10.25" y="7" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="16.5" y="4" width="3.5" height="15" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>,
  meta:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="6.5" width="6.5" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="6.5" width="6.5" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  board:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="13" width="5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9.5" y="6" width="5" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="16" y="10" width="5" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  spend:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v10M9.5 9.5C9.5 8.7 10.2 8 12 8s2.5.7 2.5 1.5c0 .8-2 1.5-2.5 2s-2.5 1.2-2.5 2 .7 2.5 2.5 2.5 2.5-.7 2.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  gbp:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2.5C8.41 2.5 5.5 5.41 5.5 9c0 5.25 6.5 12.5 6.5 12.5s6.5-7.25 6.5-12.5c0-3.59-2.91-6.5-6.5-6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  mic:      <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/><path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  micOn:    <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="7" y="2" width="6" height="10" rx="3" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.5"/><path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  send:     <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3.5 14.5L15 9 3.5 3.5v4L10 9l-6.5 1.5v4z" fill="currentColor"/></svg>,
  copy:     <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 4.5V3a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 3v6A1.5 1.5 0 003 10.5h1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  check:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus:     <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  lock:     <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="13" r="1" fill="currentColor"/></svg>,
  logout:   <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 2H4a2 2 0 00-2 2v8a2 2 0 002 2h2M10.5 11.5L14 8l-3.5-3.5M6 8h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevron:  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* ═══════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════ */
const TEAM = [
  { name: "David Hamby",     email: "dhamby@pureturfllc.com",   role: "Head of Marketing", pin: "1234" },
  { name: "David Patton",    email: "dpatton@pureturfllc.com",  role: "Owner",             pin: "1234" },
  { name: "Kaley Brownlee",  email: "kaley@pureturfllc.com",    role: "Sales",             pin: "1234" },
  { name: "Chris Kleeman",   email: "chris@pureturfllc.com",    role: "Sales",             pin: "1234" },
  { name: "Daniel Anderson", email: "daniel@pureturfllc.com",   role: "Sales",             pin: "1234" },
  { name: "Kelsey Galarza",  email: "kelsey@pureturfllc.com",   role: "Consultant",        pin: "1234" },
];

/* ═══════════════════════════════════════════════════
   QUICK ACTIONS
   ═══════════════════════════════════════════════════ */
const QA = [
  { icon: "pipeline", label: "Pipeline",       desc: "Deals by stage",           prompt: "Give me the current 2026 Sales Pipeline snapshot — how many deals in each stage and total closed won this month." },
  { icon: "gads",     label: "Google Ads",     desc: "Spend, CPA, conversions",  prompt: "Pull Google Ads performance for this month — spend, clicks, conversions, and CPA by campaign." },
  { icon: "meta",     label: "Meta Ads",        desc: "Campaign performance",     prompt: "Pull Meta/Facebook Ads performance for this month — spend, clicks, and CPM by campaign." },
  { icon: "board",    label: "Rep leaderboard", desc: "Wins per rep",             prompt: "Show me a sales rep leaderboard — total deals and closed won count per rep in the 2026 Sales Pipeline." },
  { icon: "spend",    label: "Blended spend",   desc: "Cross-platform totals",    prompt: "What's our total blended ad spend this month across Google Ads and Meta? Break it down by platform." },
  { icon: "gbp",      label: "GBP",             desc: "Views, calls, directions", prompt: "How are our Google Business Profiles performing this month? Show views, calls, direction requests, and website clicks." },
];

const MONDAY_PROMPTS = [
  `Pull Google Ads MTD performance — total spend, clicks, conversions, blended CPA, and each campaign breakdown. Format with ## sections. Keep it tight.`,
  `Pull Meta Ads MTD performance — total spend, clicks, CPM by campaign. Also calculate the blended ad spend total across Google + Meta. Format with ## sections.`,
  `Pull Google Business Profile performance this month — total views, calls, direction requests, and website clicks across all locations. Format with ## sections.`,
];
const MONDAY_PROMPT = MONDAY_PROMPTS[0]; // fallback

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function parseSuggestions(text) {
  const lines = text.split("\n");
  const suggestions = [], content = [];
  for (const l of lines) {
    if (l.trim().startsWith("SUGGEST:")) suggestions.push(l.trim().replace("SUGGEST:", "").trim());
    else content.push(l);
  }
  while (content.length && !content[content.length - 1].trim()) content.pop();
  return { content: content.join("\n"), suggestions };
}

function fmtText(text) {
  return text.split("\n").map((l, i) => {
    l = l.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${W1};font-weight:600">$1</strong>`);
    if (l.startsWith("### ")) return <div key={i} style={{ fontSize: 10, fontWeight: 700, color: W3, textTransform: "uppercase", letterSpacing: "0.1em", margin: "14px 0 5px" }}>{l.slice(4)}</div>;
    if (l.startsWith("## "))  return null;
    if (/^\d+\.\s/.test(l))  return <div key={i} style={{ paddingLeft: 4, margin: "4px 0", color: W2 }} dangerouslySetInnerHTML={{ __html: l }} />;
    if (l.startsWith("- ") || l.startsWith("* ")) return (
      <div key={i} style={{ paddingLeft: 16, position: "relative", margin: "4px 0", color: W2 }}>
        <span style={{ position: "absolute", left: 4, color: W3, fontSize: 7, top: 7 }}>●</span>
        <span dangerouslySetInnerHTML={{ __html: l.slice(2) }} />
      </div>
    );
    if (l.trim() === "") return <div key={i} style={{ height: 8 }} />;
    return <div key={i} style={{ margin: "3px 0", color: W2 }} dangerouslySetInnerHTML={{ __html: l }} />;
  }).filter(Boolean);
}

function parseAccordions(text) {
  const parts = text.split(/^(## .+)$/m);
  if (parts.length <= 1) return null;
  const intro = parts[0].trim();
  const sections = [];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({ title: parts[i].replace(/^## /, "").trim(), content: (parts[i + 1] || "").trim() });
  }
  return { intro, sections };
}

/* ═══════════════════════════════════════════════════
   ACCORDION
   ═══════════════════════════════════════════════════ */
function Accordion({ title, content, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 5, borderRadius: 12, background: TILE_BG2, border: `1px solid ${BD}`, overflow: "hidden", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: FF, WebkitTapHighlightColor: "transparent" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: open ? W1 : W2, textTransform: "uppercase", letterSpacing: "0.1em", transition: "color .15s" }}>{title}</span>
        <span style={{ fontSize: 19, color: W3, lineHeight: 1, display: "block", width: 20, textAlign: "center", transform: open ? "rotate(45deg)" : "none", transition: "transform .2s ease" }}>+</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${BD}`, padding: "11px 16px 14px", fontSize: 13.5, lineHeight: 1.72, animation: "accOpen .18s ease" }}>
          {fmtText(content)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AI MESSAGE
   ═══════════════════════════════════════════════════ */
function AIMessage({ text }) {
  const parsed = parseAccordions(text);
  if (parsed && parsed.sections.length > 0) {
    return (
      <div style={{ animation: "fadeIn .3s ease" }}>
        {parsed.intro && <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 10, color: W2 }}>{fmtText(parsed.intro)}</div>}
        {parsed.sections.map((s, i) => <Accordion key={i} title={s.title} content={s.content} defaultOpen={i === 0} />)}
      </div>
    );
  }
  return (
    <div style={{ animation: "fadeIn .3s ease", background: TILE_BG2, border: `1px solid ${BD}`, borderRadius: "4px 14px 14px 14px", padding: "13px 16px", fontSize: 14, lineHeight: 1.72, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      {fmtText(text)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COPY BTN + DOTS
   ═══════════════════════════════════════════════════ */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, border: `1px solid ${BD}`, background: "transparent", cursor: "pointer", fontSize: 11, fontWeight: 500, color: copied ? "#4ade80" : W3, fontFamily: FF, transition: "color .15s", WebkitTapHighlightColor: "transparent", marginTop: 9 }}>
      {copied ? ic.check : ic.copy}{copied ? "Copied" : "Copy"}
    </button>
  );
}

function Dots() {
  return <div style={{ display: "flex", gap: 5, padding: "4px 0" }}>{[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: W3, animation: `dot 1.4s ease ${i*.2}s infinite` }} />)}</div>;
}

/* ═══════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════ */
async function callAPI(messages) {
  const res = await fetch("/.netlify/functions/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    let detail = "";
    try { const d = await res.json(); detail = d.error || d.detail || ""; } catch {}
    throw new Error(`API error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const d = await res.json();
  return d.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Couldn't retrieve that data. Try again.";
}

/* ═══════════════════════════════════════════════════
   SIDEBAR CONTENT (shared between mobile empty state + desktop sidebar)
   ═══════════════════════════════════════════════════ */
function SidebarContent({ user, greet, firstName, today, busy, onSend, isMobile }) {
  const tileStyle = (extra = {}) => ({
    display: "block", width: "100%", padding: "15px 15px", borderRadius: 13,
    background: TILE_BG, border: `1px solid ${BD}`,
    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    cursor: busy ? "default" : "pointer", textAlign: "left", fontFamily: FF,
    WebkitTapHighlightColor: "transparent", transition: "border-color .15s, background .15s",
    ...extra,
  });

  return (
    <div style={{ padding: isMobile ? "28px 16px 16px" : "28px 20px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: W3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{today}</div>
        <div style={{ fontSize: isMobile ? 26 : 22, fontWeight: 600, color: W1, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{greet},<br />{firstName}.</div>
        {user.role && <div style={{ fontSize: 11, color: W3, marginTop: 6 }}>{user.role}</div>}
      </div>

      {/* Monday briefing */}
      <button className="pt-tile" onClick={() => !busy && onSend(MONDAY_PROMPT)} disabled={busy} style={{
        ...tileStyle({ marginBottom: 8 }),
        background: `linear-gradient(140deg, rgba(13,31,74,0.85) 0%, rgba(4,20,62,0.75) 100%)`,
        border: "1px solid rgba(80,110,200,0.18)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.13em", marginBottom: 6 }}>Monday Morning</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: W1, marginBottom: 3 }}>Full briefing</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>Pipeline · Ads · Reps · GBP</div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.22)", flexShrink: 0, marginLeft: 12 }}>{ic.chevron}</div>
      </button>

      {/* Action grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 16 }}>
        {QA.map(q => (
          <button className="pt-tile" key={q.label} onClick={() => !busy && onSend(q.prompt)} disabled={busy} style={tileStyle({ padding: "13px 13px" })}>
            <div style={{ color: W3, marginBottom: 9, display: "flex" }}>{ic[q.icon]}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: W1, marginBottom: 2, lineHeight: 1.2 }}>{q.label}</div>
            <div style={{ fontSize: 10, color: W3, lineHeight: 1.35 }}>{q.desc}</div>
          </button>
        ))}
      </div>

      {/* Connected sources */}
      <div style={{ padding: "12px 14px", borderRadius: 11, background: TILE_BG2, border: `1px solid ${BD}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: W3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Connected</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {["HubSpot CRM", "Google Ads", "Meta Ads", "Google Business"].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: `1px solid ${BD}` }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: W2, fontWeight: 500 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError("");
    setTimeout(() => {
      const user = TEAM.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.pin === pin);
      if (user) onLogin(user);
      else { setError("Invalid credentials."); setLoading(false); }
    }, 500);
  }

  const field = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1px solid ${BD}`, background: "rgba(255,255,255,0.06)",
    fontSize: 14, fontFamily: FF, outline: "none", color: W1,
    WebkitAppearance: "none", transition: "border-color .15s",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  };

  return (
    <div style={{
      fontFamily: FF, height: "100dvh", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:rgba(242,242,245,0.28)}
        input:focus{border-color:rgba(255,255,255,0.18) !important}
      `}</style>

      {/* Full-bleed photo */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/lawn-dusk.jpg')", backgroundSize: "cover", backgroundPosition: "center 40%" }} />
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg, rgba(4,8,20,0.88) 0%, rgba(4,20,62,0.72) 50%, rgba(4,8,20,0.92) 100%)" }} />

      {/* Card */}
      <div style={{ position: "relative", width: "100%", maxWidth: 360, padding: "0 20px", animation: "slideUp .5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: W1, width: 130 }} dangerouslySetInnerHTML={{ __html: LOGO_FULL }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.8)", background: NAV, padding: "3px 7px", borderRadius: 5, letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.12)" }}>AI</span>
          </div>
        </div>

        <div style={{
          background: "rgba(10,12,20,0.72)", borderRadius: 20, padding: "28px 24px",
          border: `1px solid ${BD}`,
          backdropFilter: "blur(28px) saturate(1.4)", WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", color: W3, marginBottom: 14 }}>{ic.lock}</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: W1 }}>Sign in</div>
            <div style={{ fontSize: 12, color: W3, marginTop: 4 }}>Pure Turf marketing intelligence</div>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: W3, display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.09em" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@pureturfllc.com" required autoComplete="email" style={field} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: W3, display: "block", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.09em" }}>PIN</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" required maxLength={6} style={{ ...field, letterSpacing: "0.2em" }} />
            </div>
            {error && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 16, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(242,242,245,0.92)", color: "#0a0c12", fontSize: 14, fontWeight: 600, fontFamily: FF, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.65 : 1, transition: "opacity .15s" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "rgba(242,242,245,0.2)", marginTop: 16 }}>Internal use only</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════ */
export default function App() {
  const [user, setUser]               = useState(null);
  const [msgs, setMsgs]               = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput]             = useState("");
  const [busy, setBusy]               = useState(false);
  const [hist, setHist]               = useState([]);
  const [listening, setListening]     = useState(false);
  const scrollRef = useRef(null);
  const textRef   = useRef(null);
  const recogRef  = useRef(undefined);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, busy, suggestions]);

  const autoSize = useCallback(() => {
    const el = textRef.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);
  useEffect(autoSize, [input, autoSize]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = "en-US";
      r.onresult = (e) => setInput(prev => prev + (prev ? " " : "") + e.results[0][0].transcript);
      r.onend = () => setListening(false); r.onerror = () => setListening(false);
      recogRef.current = r;
    }
  }, []);

  function toggleVoice() {
    if (!recogRef.current) return;
    if (listening) recogRef.current.stop(); else { recogRef.current.start(); setListening(true); }
  }

  async function send(t) {
    if (!t?.trim() || busy) return;
    setMsgs(p => [...p, { r: "u", t }]); setSuggestions([]); setInput(""); setBusy(true);
    const nh = [...hist, { role: "user", content: t }];
    try {
      const raw = await callAPI(nh);
      const { content, suggestions: sug } = parseSuggestions(raw);
      setMsgs(p => [...p, { r: "a", t: content }]);
      setSuggestions(sug);
      setHist([...nh, { role: "assistant", content: raw }]);
      if (navigator.vibrate) navigator.vibrate(10);
    } catch (err) {
      setMsgs(p => [...p, { r: "a", t: `Connection error — ${err.message}. Check your network and try again.` }]);
    }
    setBusy(false);
  }

  function reset() { setMsgs([]); setHist([]); setInput(""); setSuggestions([]); }

  async function sendMondayBriefing() {
    if (busy) return;
    setSuggestions([]); setInput("");
    // Fire 3 separate queries sequentially so none times out
    for (const prompt of MONDAY_PROMPTS) {
      setMsgs(p => [...p, { r: "u", t: prompt }]);
      setBusy(true);
      const nh = [...hist, { role: "user", content: prompt }];
      try {
        const raw = await callAPI(nh);
        const { content: parsed, suggestions: sug } = parseSuggestions(raw);
        setMsgs(p => [...p, { r: "a", t: parsed }]);
        setHist(h => [...h, { role: "user", content: prompt }, { role: "assistant", content: raw }]);
        if (sug.length) setSuggestions(sug);
      } catch (err) {
        setMsgs(p => [...p, { r: "a", t: `Error: ${err.message}` }]);
      }
      setBusy(false);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  const hr = new Date().getHours();
  const greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

  const inputBar = (
    <div style={{
      padding: "10px 14px", paddingBottom: "max(10px, env(safe-area-inset-bottom))",
      borderTop: `1px solid ${BD}`, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "4px 4px 4px 14px", border: `1px solid ${BD}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
        {recogRef.current !== undefined && (
          <button onClick={toggleVoice} style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, border: "none", background: listening ? "rgba(248,113,113,0.12)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: listening ? "#f87171" : W3, transition: "all .2s", animation: listening ? "pulse 1.5s ease infinite" : "none", WebkitTapHighlightColor: "transparent" }}>
            {listening ? ic.micOn : ic.mic}
          </button>
        )}
        <textarea ref={textRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about pipeline, ads, reps…" rows={1}
          style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", fontSize: 14, fontFamily: FF, padding: "8px 0", color: W1, lineHeight: 1.4, WebkitAppearance: "none", maxHeight: 120 }} />
        <button onClick={() => send(input)} disabled={!input.trim() || busy}
          style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: input.trim() && !busy ? "rgba(242,242,245,0.92)" : "transparent", border: `1px solid ${input.trim() && !busy ? "transparent" : BD}`, cursor: input.trim() && !busy ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s", WebkitTapHighlightColor: "transparent", color: input.trim() && !busy ? "#0a0c12" : W3 }}>
          {ic.send}
        </button>
      </div>
    </div>
  );

  const chatContent = (
    <>
      {/* Scroll area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* Mobile empty state — inline sidebar content */}
        <div className="mobile-empty" style={{ display: msgs.length === 0 ? "block" : "none" }}>
          <SidebarContent user={user} greet={greet} firstName={firstName} today={today} busy={busy} onSend={send} isMobile />
        </div>

        {/* Messages */}
        {msgs.length > 0 && (
          <div style={{ padding: "16px 14px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ animation: "fadeIn .25s ease" }}>
                {m.r === "u" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: "rgba(4,20,62,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(80,110,200,0.15)", color: W1, borderRadius: "16px 16px 4px 16px", padding: "10px 16px", fontSize: 14, lineHeight: 1.55, maxWidth: "82%" }}>{m.t}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                      <div style={{ width: 18, height: 18, color: W3, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: PT_MARK }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: W3, textTransform: "uppercase", letterSpacing: "0.1em" }}>Pure Turf AI</span>
                    </div>
                    <AIMessage text={m.t} />
                    <CopyBtn text={m.t} />
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div style={{ animation: "fadeIn .25s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                  <div style={{ width: 18, height: 18, color: W3 }} dangerouslySetInnerHTML={{ __html: PT_MARK }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: W3, textTransform: "uppercase", letterSpacing: "0.1em" }}>Pure Turf AI</span>
                </div>
                <div style={{ background: TILE_BG2, border: `1px solid ${BD}`, borderRadius: "4px 14px 14px 14px", padding: "13px 16px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                  <Dots />
                  <div style={{ fontSize: 11, color: W3, marginTop: 5 }}>Pulling data…</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !busy && (
        <div style={{ padding: "9px 14px 7px", borderTop: `1px solid ${BD}`, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: W3, textTransform: "uppercase", letterSpacing: "0.11em", marginBottom: 7 }}>Suggested</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
            {suggestions.map((s, i) => (
              <button className="pt-chip" key={i} onClick={() => { setSuggestions([]); send(s); }}
                style={{ padding: "7px 13px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", background: "rgba(255,255,255,0.05)", border: `1px solid ${BDA}`, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 20, cursor: "pointer", color: W2, fontFamily: FF, flexShrink: 0, WebkitTapHighlightColor: "transparent", transition: "all .15s" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick chips */}
      {msgs.length > 0 && !busy && suggestions.length === 0 && (
        <div style={{ padding: "7px 14px", display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none", borderTop: `1px solid ${BD}`, flexShrink: 0 }}>
          {QA.map(q => (
            <button className="pt-chip" key={q.label} onClick={() => send(q.prompt)}
              style={{ padding: "6px 12px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", background: "rgba(255,255,255,0.04)", border: `1px solid ${BD}`, borderRadius: 20, cursor: "pointer", color: W3, fontFamily: FF, flexShrink: 0, WebkitTapHighlightColor: "transparent", transition: "all .15s" }}>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {inputBar}
    </>
  );

  return (
    <div style={{ fontFamily: FF, height: "100dvh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{-webkit-text-size-adjust:100%} body{overscroll-behavior:none}
        ::-webkit-scrollbar{width:0;display:none}
        textarea::placeholder{color:rgba(242,242,245,0.28)} textarea{caret-color:${W1}}
        @keyframes dot{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:.7;transform:scale(1)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(248,113,113,.35)}70%{box-shadow:0 0 0 7px rgba(248,113,113,0)}100%{box-shadow:0 0 0 0 rgba(248,113,113,0)}}
        @keyframes accOpen{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        .pt-tile:active{transform:scale(.97) !important}
        @media(hover:hover){
          .pt-tile:hover{border-color:rgba(255,255,255,0.15) !important;background:rgba(255,255,255,0.07) !important}
          .pt-chip:hover{background:rgba(255,255,255,0.08) !important;border-color:rgba(255,255,255,0.15) !important;color:${W1} !important}
          .pt-hbtn:hover{border-color:rgba(255,255,255,0.15) !important;color:${W2} !important}
        }

        /* ── MOBILE (default) ── */
        .pt-bg-photo{ display:none }
        .pt-layout{ display:flex; flex-direction:column; height:100dvh; background:#0B0B0D }
        .pt-sidebar{ display:none }
        .pt-chat{ display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden }
        .pt-header{ display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0 }
        .mobile-empty{ display:block }

        /* ── DESKTOP (≥768px) ── */
        @media(min-width:768px){
          /* Background photo layer */
          .pt-bg-photo{
            display:block; position:fixed; inset:0; z-index:0;
            background-image:url('/lawn-dusk.jpg');
            background-size:cover; background-position:center 55%;
          }
          .pt-bg-overlay{
            position:fixed; inset:0; z-index:1;
            background:linear-gradient(155deg, rgba(4,6,16,0.82) 0%, rgba(4,18,50,0.65) 50%, rgba(4,6,16,0.88) 100%);
          }

          /* Layout */
          .pt-layout{
            position:relative; z-index:2;
            display:flex; flex-direction:row; height:100dvh;
            background:transparent;
            padding:16px; gap:12px;
          }

          /* Sidebar */
          .pt-sidebar{
            display:flex; flex-direction:column;
            width:300px; flex-shrink:0;
            background:${GLASS_BG};
            backdrop-filter:blur(28px) saturate(1.3);
            -webkit-backdrop-filter:blur(28px) saturate(1.3);
            border:1px solid ${BD};
            border-radius:20px;
            overflow:hidden;
          }
          .pt-sidebar-scroll{
            flex:1; overflow-y:auto; scrollbar-width:none;
          }
          .pt-sidebar-footer{
            padding:12px 16px;
            border-top:1px solid rgba(255,255,255,0.06);
            display:flex; align-items:center; justify-content:space-between;
          }

          /* Chat area */
          .pt-chat{
            flex:1; min-width:0;
            display:flex; flex-direction:column;
            background:${GLASS_BG2};
            backdrop-filter:blur(24px) saturate(1.2);
            -webkit-backdrop-filter:blur(24px) saturate(1.2);
            border:1px solid ${BD};
            border-radius:20px;
            overflow:hidden;
          }
          .pt-header{
            border-radius:20px 20px 0 0;
          }

          /* On desktop, mobile-only empty state is hidden */
          .mobile-empty{ display:none !important }
        }

        @media(min-width:1100px){
          .pt-sidebar{ width:340px }
          .pt-layout{ padding:20px; gap:14px }
        }
        @media(min-width:1400px){
          .pt-sidebar{ width:360px }
        }
      `}</style>

      {/* Photo background (desktop only via CSS) */}
      <div className="pt-bg-photo" />
      <div className="pt-bg-photo pt-bg-overlay" />

      <div className="pt-layout">

        {/* ── DESKTOP SIDEBAR ─────────────────────── */}
        <aside className="pt-sidebar">
          {/* Sidebar header */}
          <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${BD}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: W1, width: 100 }} dangerouslySetInnerHTML={{ __html: LOGO_FULL }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,.75)", background: NAV, padding: "3px 6px", borderRadius: 4, letterSpacing: "0.11em", border: "1px solid rgba(255,255,255,0.1)" }}>AI</span>
            </div>
          </div>
          {/* Sidebar scroll */}
          <div className="pt-sidebar-scroll">
            <SidebarContent user={user} greet={greet} firstName={firstName} today={today} busy={busy} onSend={send} isMobile={false} />
          </div>
          {/* Sidebar footer */}
          <div className="pt-sidebar-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: W2 }}>{firstName[0]}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: W1, lineHeight: 1 }}>{user.name}</div>
                <div style={{ fontSize: 10, color: W3, marginTop: 2 }}>{user.role}</div>
              </div>
            </div>
            <button className="pt-hbtn" onClick={() => setUser(null)} title="Sign out"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: "transparent", border: `1px solid ${BD}`, color: W3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: FF, WebkitTapHighlightColor: "transparent", transition: "all .15s" }}>
              {ic.logout} Sign out
            </button>
          </div>
        </aside>

        {/* ── CHAT PANEL ──────────────────────────── */}
        <main className="pt-chat">
          {/* Header */}
          <div className="pt-header" style={{ background: "transparent" }}>
            {/* Mobile: logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: W1 }} className="mobile-logo">
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ color: W1, width: 100 }} dangerouslySetInnerHTML={{ __html: LOGO_FULL }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,.75)", background: NAV, padding: "3px 6px", borderRadius: 4, letterSpacing: "0.11em" }}>AI</span>
                </div>
              </div>
              {/* Desktop: chat title */}
              <div className="desktop-title" style={{ display: "none" }}>
                {msgs.length > 0
                  ? <span style={{ fontSize: 12, fontWeight: 600, color: W3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Conversation</span>
                  : <span style={{ fontSize: 12, fontWeight: 600, color: W3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ask anything</span>
                }
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {msgs.length > 0 && (
                <button className="pt-hbtn" onClick={reset}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, background: "transparent", border: `1px solid ${BD}`, color: W3, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: FF, WebkitTapHighlightColor: "transparent", transition: "all .15s" }}>
                  {ic.plus} New
                </button>
              )}
              {/* Mobile-only sign out */}
              <button className="pt-hbtn mobile-only-btn" onClick={() => setUser(null)}
                style={{ display: "flex", alignItems: "center", padding: "6px 10px", borderRadius: 8, background: "transparent", border: `1px solid ${BD}`, color: W3, cursor: "pointer", WebkitTapHighlightColor: "transparent", transition: "all .15s" }}>
                {ic.logout}
              </button>
            </div>
          </div>

          {chatContent}
        </main>
      </div>

      {/* Extra responsive tweaks */}
      <style>{`
        @media(min-width:768px){
          .mobile-logo{ display:none !important }
          .desktop-title{ display:block !important }
          .mobile-only-btn{ display:none !important }
        }
      `}</style>
    </div>
  );
}
