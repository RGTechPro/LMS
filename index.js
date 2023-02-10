const express = require("express");
const app = express();

const users = [
  {
    username: "id1",
    password: "pass1",
  },
  {
    username: "id2",
    password: "pass2",
  },
];

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let worker = async ({ sessID, qrID }) => {
  const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 10,

    
        
        // and provide executable path (in this case for a Chrome installation in Ubuntu)
        puppeteerOptions: {
            executablePath: 'chromium-browser',
          
        },
    });

  await cluster.task(async ({ page, data: userData }) => {
    await page.goto("https://lms.thapar.edu/moodle/login/");
    await page.type("#username", userData.username);
    await page.type("#password", userData.password);

    // Wait and click on first result
    // console.log(userData);
    const searchResultSelector = "#loginbtn";
    await page.waitForSelector(searchResultSelector);
    await page.click(searchResultSelector);
    // await timeout(2000);

    let nameSelector = await page.waitForSelector("#actionmenuaction-1");
    let element = await page.$("#actionmenuaction-1");
    let user_name = await page.evaluate((el) => el.textContent, element);
    console.log(user_name);

    // await timeout(4000);
    const path = user_name + ".png";

    await page.screenshot({ path });
    console.log(sessID, qrID);

    let url = `https://lms.thapar.edu/moodle/mod/attendance/attendance.php?sessid=${sessID}&qrpass=${qrID}`;

    // let url = "https://lms.thapar.edu/moodle/user/profile.php";

    await page.goto(url);

    // await page.screenshot({ path });
  });

  for (let i = 0; i < users.length; i++) {
    cluster.queue(users[i]);
  }

  // many more pages

  await cluster.idle();
  await cluster.close();
};
let name = "";
let display = async ({ user, pass }) => {
  const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 10,

    
        
        // and provide executable path (in this case for a Chrome installation in Ubuntu)
        puppeteerOptions: {
            executablePath: 'chromium-browser',
          
        },
    });

  await cluster.task(async ({ page, data: userData }) => {
    await page.goto("https://lms.thapar.edu/moodle/login/");
    await page.type("#username", userData.username);
    await page.type("#password", userData.password);

    // Wait and click on first result
    // console.log(userData);
    const searchResultSelector = "#loginbtn";
    await page.waitForSelector(searchResultSelector);
    await page.click(searchResultSelector);
    // await timeout(2000);

    let nameSelector = await page.waitForSelector("#actionmenuaction-1");
    let element = await page.$("#actionmenuaction-1");
    let user_name = await page.evaluate((el) => el.textContent, element);
    console.log(user_name);
    name = user_name;

   

    // await page.screenshot({ path });
  });

  cluster.queue({username:user ,password:pass});

  // many more pages

  await cluster.idle();
  await cluster.close();
};
const { Cluster } = require("puppeteer-cluster");
app.get("/session/:sessID/qrcode/:qrID", async function (req, res) {
  await worker({ sessID: req.params.sessID, qrID: req.params.qrID });
  res.send("Done");
});
app.get("/user/:user/:pass", async function (req, res) {
  await display({ user: req.params.user, pass: req.params.pass });
  await timeout(100);
  res.send(name);
});

app.get("/", (req, res) => {
  res.send("HI");
});

app.listen(3000, () => {
  console.log("Server started at 3000");
});
