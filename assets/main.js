(() => {
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
