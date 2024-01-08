require("dotenv").config();
const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
      "--window-size=1280,960",
      "--no-service-autorun",
      "--start-maximized",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      "--window-position=0,0",
      "--disable-infobars",
      "--disable-notifications",
    ],
  });
  const page = await browser.newPage();
  await page.goto(
    "https://www.linkedin.com/login/pt?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin"
  );
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const login = process.env.LINKEDIN_LOGIN;
  const inputEmail = await page.$("input[type=text]");
  await inputEmail.click();
  await inputEmail.type(`${login}`);

  const password = process.env.LINKEDIN_PASSWORD;
  const inputPassword = await page.$("input[type=password]");
  await inputPassword.click();
  await inputPassword.type(`${password}`);

  let signInBtn = await page.waitForSelector(".btn__primary--large");
  await signInBtn.click();

  await page.waitForNavigation({
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => {
    return (
      window.location.href ===
      "https://www.linkedin.com/feed/?trk=guest_homepage-basic_nav-header-signin"
    );
  });
  let searchBtn = await page.waitForSelector(
    ".search-global-typeahead__collapsed-search-button"
  );
  await searchBtn.click();
  let searchBar = await page.waitForSelector(".search-global-typeahead__input");
  const searchText = process.env.SEARCH_TEXT;
  await searchBar.type(`${searchText}`);
  await searchBar.press("Enter");
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  const linkText = "Ver todos os resultados de pessoas";
  await page.evaluate((linkText) => {
    const links = document.querySelectorAll("a");
    for (const link of links) {
      if (link.textContent === linkText) {
        link.click();
        break;
      }
    }
  }, linkText);
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate((pageHeight) => {
    window.scrollBy(0, pageHeight);
  }, pageHeight);
  const buttonSelector = 'button[aria-label^="Convidar"]';
  const liSelector = "li.reusable-search__result-container";

  const liElements = await page.$$(liSelector);

  let currentPage = 1;
  const maxPage = 10;

  while (currentPage <= maxPage) {
    const liElements = await page.$$(liSelector);
    console.log(`Iniciando página ${currentPage}`);
    for (const liElement of liElements) {
      const connectButton = await liElement.$(buttonSelector);

      if (connectButton) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await connectButton.click();
        console.log('Botão "Conectar" encontrado e clicado.');
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const sendButton = await page.$('button[aria-label="Enviar agora"]');
        if (sendButton) {
          await sendButton.click();
          console.log('Botão "Enviar agora" encontrado e clicado.');
        } else {
          console.log('Botão "Enviar agora" não encontrado.');
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.click(`button[aria-label="Página ${currentPage + 1}"]`);
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    currentPage++;
  }
})();
