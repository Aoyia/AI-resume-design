const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 1100 });

  console.log('Navigating to http://localhost:3001...');
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (e) {
    console.log('Navigation fallback...');
    await page.goto('http://localhost:3001', { waitUntil: 'load', timeout: 15000 });
  }

  console.log('Waiting 5s for page to hydrate...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('Checking for "我的简历" button...');
  const buttons = await page.$$('button');
  let managerBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('我的简历')) {
      managerBtn = btn;
      break;
    }
  }

  if (managerBtn) {
    console.log('Found "我的简历" button. Clicking to open manager...');
    await managerBtn.click();
    await new Promise(r => setTimeout(r, 1000)); // 等待展开动画

    // 截图并检查是否渲染出来了“简历列表管理”
    const screenshotPath = '/Users/neoyuan/.gemini/antigravity/brain/40696174-a6a6-4bb0-bd5d-41580f030423/resume_manager_check.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

    const panelText = await page.evaluate(() => {
      const el = document.body;
      return el.innerHTML.includes('简历列表管理') ? 'Yes' : 'No';
    });
    console.log(`Is "简历列表管理" rendered inside the panel? ${panelText}`);

    const backupText = await page.evaluate(() => {
      const el = document.body;
      return el.innerHTML.includes('备份与恢复') ? 'Yes' : 'No';
    });
    console.log(`Is "备份与恢复" section rendered? ${backupText}`);
  } else {
    console.error('Could not find "我的简历" button on the toolbar!');
  }

  await browser.close();
})();
