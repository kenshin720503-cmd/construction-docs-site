(() => {
  // ── 유입 채널 기록 (UTM + 어디서 왔는지) ──────────────────────────
  // 손님이 처음 들어온 경로를 이 브라우저에 30일 동안 기억했다가 견적 요청과 함께 보낸다.
  // UTM이 붙은 링크로 다시 들어오면 새 값으로 바꾼다. 개인정보는 담지 않는다.
  const KEY = 'acq';
  const DAYS = 30;
  const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && Date.now() - v.at < DAYS * 864e5) return v;
    } catch {}
    return null;
  };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  // 검색엔진·SNS 주소를 알아보기 쉬운 이름으로
  const fromReferrer = (ref) => {
    let host = '';
    try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch { return null; }
    if (!host || host === location.hostname) return null;
    const rules = [
      [/(^|\.)google\./, 'google', 'organic'],
      [/(^|\.)naver\.com$/, 'naver', 'organic'],
      [/(^|\.)daum\.net$|(^|\.)kakao\.com$/, 'daum', 'organic'],
      [/(^|\.)bing\.com$/, 'bing', 'organic'],
      [/(^|\.)instagram\.com$/, 'instagram', 'social'],
      [/(^|\.)facebook\.com$/, 'facebook', 'social'],
      [/(^|\.)youtube\.com$/, 'youtube', 'social'],
    ];
    for (const [re, source, medium] of rules) if (re.test(host)) return { source, medium };
    return { source: host, medium: 'referral' };
  };

  const capture = () => {
    const q = new URLSearchParams(location.search);
    const utm = {};
    for (const k of UTM) { const v = q.get(k); if (v) utm[k] = v.slice(0, 100); }
    const stored = read();
    const hasUtm = Object.keys(utm).length > 0;
    if (stored && !hasUtm) return stored;

    const ref = document.referrer || '';
    const guess = fromReferrer(ref);
    // 바깥에서 들어온 게 아니면(같은 사이트 안 이동) 기존 기록을 유지
    if (stored && !guess) return stored;

    const v = {
      at: Date.now(),
      utm_source: utm.utm_source || (guess ? guess.source : '(direct)'),
      utm_medium: utm.utm_medium || (guess ? guess.medium : '(none)'),
      utm_campaign: utm.utm_campaign || '',
      utm_term: utm.utm_term || '',
      utm_content: utm.utm_content || '',
      referrer: ref.slice(0, 300),
      landing_page: (location.pathname + location.search).slice(0, 300),
    };
    save(v);
    return v;
  };

  const acq = capture();

  // ── 견적 요청 폼 ───────────────────────────────────────────────
  const form = document.getElementById('quote-form');
  if (!form) return;
  const msg = form.querySelector('.form-msg');
  const btn = form.querySelector('button[type="submit"]');

  const show = (text, kind) => {
    msg.textContent = text;
    msg.className = 'form-msg ' + (kind || '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value,
      website: form.website.value,
      consent: form.consent.checked,
      acq: {
        utm_source: acq.utm_source,
        utm_medium: acq.utm_medium,
        utm_campaign: acq.utm_campaign,
        utm_term: acq.utm_term,
        utm_content: acq.utm_content,
        referrer: acq.referrer,
        landing_page: acq.landing_page,
      },
    };
    if (!data.name || !data.contact) return show('이름과 연락처를 적어 주세요.', 'err');
    if (!data.message) return show('필요한 서류를 골라 주세요.', 'err');
    if (!data.consent) return show('개인정보 수집·이용에 동의해 주세요.', 'err');

    btn.disabled = true;
    show('보내는 중이에요…');
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      show('견적 요청을 받았어요. 확인 후 연락드릴게요.', 'ok');
    } catch (err) {
      show(err.message || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
