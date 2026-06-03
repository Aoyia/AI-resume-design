const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 1100 });

  console.log('Navigating to http://localhost:3000...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch (e) {
    console.log('Navigation fallback...');
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 15000 });
  }

  // 延长等待时间至 6 秒以确保 React 客户端水合 (hydration) 完全就绪
  console.log('Waiting 6s for page to hydrate...');
  await new Promise(r => setTimeout(r, 6000));

  // 展开项目经历以确保表单可见
  try {
    const headers = await page.$$('.select-none.cursor-pointer');
    for (const header of headers) {
      const text = await page.evaluate(el => el.textContent, header);
      if (text.includes('项目经历')) {
        console.log('Found "项目经历" header, clicking to expand...');
        await header.click();
        await new Promise(r => setTimeout(r, 1000)); // 等待展开动画
        break;
      }
    }
  } catch (e) {
    console.error('Error toggling accordion:', e);
  }

  console.log('Testing whitespace-pre-wrap in project company input and preview...');
  try {
    // 寻找输入框
    const inputs = await page.$$('input');
    let projectInput = null;
    for (const input of inputs) {
      const val = await page.evaluate(el => el.value, input);
      if (val && val.includes('得帆云低代码平台')) {
        projectInput = input;
        break;
      }
    }

    if (projectInput) {
      console.log('Found project company input, focusing and typing with multiple spaces...');
      // 聚焦
      await projectInput.focus();
      // 三击全选并删除旧值
      await projectInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 200));
      
      // 输入包含多个空格的值
      const testVal = '得帆云低代码平台      核心前端';
      await projectInput.type(testVal);
      console.log(`Typed test value: "${testVal}"`);
      
      // 等待组件的 150ms onChange 延迟及重新渲染
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('Could not find project company input directly! Dom state may not be open.');
    }
  } catch (e) {
    console.error('Error during input interaction:', e);
  }

  // 截个图
  const screenshotPath = '/Users/neoyuan/.gemini/antigravity/brain/84d37b0f-ebd4-4a63-95ac-014f712c254c/layout_check.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);

  // 检查右侧预览中“项目”节点的文字是否完整保留了空格，并且 white-space 是否是 pre-wrap
  const previewInfo = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('span, div'));
    const projectPreview = elements.find(el => el.textContent.includes('得帆云低代码平台') && !el.querySelector('input') && el.tagName === 'SPAN');
    if (!projectPreview) return 'Could not find project company preview element';

    const computedStyle = window.getComputedStyle(projectPreview);
    return {
      tagName: projectPreview.tagName,
      className: projectPreview.className,
      textContent: projectPreview.textContent,
      computedWhiteSpace: computedStyle.whiteSpace,
      width: computedStyle.width
    };
  });

  console.log('\n--- Preview Element Analysis ---');
  console.log(previewInfo);

  await browser.close();
})();
