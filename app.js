const $ = (s) => document.querySelector(s);
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let ENC, DATA, z = 1;

async function unlock(pass) {
  ENC ||= await (await fetch('data.enc.json')).json();
  try {
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(ENC.salt), iterations: ENC.iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    DATA = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(ENC.iv) }, key, b64(ENC.ct))));
    return true;
  } catch { return false; }
}

$('#pwForm').onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, h = $('#hint');
  if (await unlock($('#pw').value)) { $('#lock').hidden = true; $('#desk').hidden = false; return; }
  f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
  h.textContent = '비밀번호가 올바르지 않습니다'; h.classList.add('err');
  $('#pw').value = ''; $('#pw').focus();
};

function openWin(id) {
  const old = document.getElementById('w-' + id);
  if (old) { old.style.zIndex = ++z; return; }
  const memo = id === 'memo';
  const title = memo ? '관찰 메모.txt - 메모장' : { trash: '휴지통', docs: '문서', dl: '다운로드' }[id];
  const w = document.createElement('div');
  w.className = 'win'; w.id = 'w-' + id; w.style.zIndex = ++z;
  const off = document.querySelectorAll('.win').length * 14;
  w.style.left = `calc(15% + ${off}px)`; w.style.top = `calc(7% + ${off}px)`;
  w.innerHTML = '<div class="tt"><span></span><span><b data-x>✕</b></span></div>' +
    (memo ? '<div class="mn"><span>파일</span><span>편집</span><span>보기</span><span class="gear">⚙</span></div><div class="bd"></div><div class="sb"><span>줄 1, 열 1</span><span>100%</span><span>Windows (CRLF)</span><span>UTF-8</span></div>'
          : '<div class="bd empty">이 폴더는 비어 있습니다.</div>');
  w.querySelector('.tt span').textContent = title;
  if (memo) w.querySelector('.bd').textContent = DATA.memo;
  w.querySelector('[data-x]').onclick = () => w.remove();
  w.onmousedown = () => (w.style.zIndex = ++z);
  const tt = w.querySelector('.tt');
  tt.onpointerdown = (e) => {
    if (e.target.dataset.x !== undefined) return;
    const r = w.getBoundingClientRect(), p = w.offsetParent.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    tt.setPointerCapture(e.pointerId);
    tt.onpointermove = (m) => { w.style.left = m.clientX - dx - p.left + 'px'; w.style.top = m.clientY - dy - p.top + 'px'; };
    tt.onpointerup = () => (tt.onpointermove = null);
  };
  $('#wins').append(w);
}

document.querySelectorAll('.ic').forEach((b) => {
  b.onclick = () => { document.querySelectorAll('.ic').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); };
  b.ondblclick = () => openWin(b.dataset.open);
  b.addEventListener('click', () => matchMedia('(pointer:coarse),(max-width:700px)').matches && openWin(b.dataset.open));
  b.onkeydown = (e) => e.key === 'Enter' && openWin(b.dataset.open);
});
