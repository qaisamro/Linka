const LOGO_URL = 'https://linka2026.replit.app/linka-logo.jpeg';

function emailHeader(title = '') {
  return `
  <div dir="rtl" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;text-align:right;color:#344F1F;padding:20px;background-color:#f9f5f0;">
    <div style="background:white;border-radius:16px;padding:35px 30px;box-shadow:0 8px 20px rgba(0,0,0,0.06);max-width:600px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:22px;">
        <img src="${LOGO_URL}" alt="لينكا Linka" style="max-width:130px;height:auto;border-radius:14px;border:2px solid #F2EAD3;box-shadow:0 4px 10px rgba(0,0,0,0.08);" />
      </div>
      ${title ? `<h2 style="color:#F4991A;text-align:center;margin-top:0;font-size:22px;">${title}</h2>` : ''}
  `;
}

function emailFooter() {
  return `
      <div style="border-top:2px dashed #eee;padding-top:15px;margin-top:25px;text-align:center;color:#aaa;font-size:12px;">
        <strong style="color:#344F1F;">— منصة لينكا Linka —</strong><br/>فلسطين
      </div>
    </div>
  </div>
  `;
}

module.exports = { LOGO_URL, emailHeader, emailFooter };
