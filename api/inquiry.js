// 견적 요청 받기 — 키는 환경변수로만 읽는다. 브라우저에는 키가 없다.
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const sbHeaders = () => ({
  apikey: SB_KEY,
  ...(String(SB_KEY).startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}),
  'Content-Type': 'application/json',
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요' });
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase 연결 정보가 없어요. Vercel Storage 연결 후 다시 배포해 주세요.' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // 스팸 함정 칸(사람에게는 안 보임)
  const a = (b.acq && typeof b.acq === 'object') ? b.acq : {};
  const row = {
    name: clip(b.name, 50), contact: clip(b.contact, 100), message: clip(b.message, 1000), consent: b.consent === true,
    // 유입 채널 (없으면 '(direct)')
    utm_source: clip(a.utm_source, 100) || '(direct)',
    utm_medium: clip(a.utm_medium, 100) || '(none)',
    utm_campaign: clip(a.utm_campaign, 100) || null,
    utm_term: clip(a.utm_term, 100) || null,
    utm_content: clip(a.utm_content, 100) || null,
    referrer: clip(a.referrer, 300) || null,
    landing_page: clip(a.landing_page, 300) || null,
  };
  if (!row.name || !row.contact) return res.status(400).json({ error: '이름과 연락처를 적어 주세요.' });
  if (!row.message) return res.status(400).json({ error: '필요한 서류를 골라 주세요.' });
  if (!row.consent) return res.status(400).json({ error: '개인정보 수집·이용에 동의해 주세요.' });
  const r = await fetch(`${SB_URL}/rest/v1/inquiries`, { method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) return res.status(500).json({ error: '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' });
  return res.status(200).json({ ok: true });
};
