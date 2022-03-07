const express = require("express");
const u = require("util");
const { exec } = require("child_process");

const project = "octovolt";
const icon = "🐕";
const port = 9998;
const uri = "https://octovolt.sidious.pizza/github";
const username = "sidiousvic";

const execAsync = u.promisify(exec);
const GitHubWebhook = express();

GitHubWebhook.use(express.json());

async function deploy() {
  console.log("⛓  Running deploy script...");
  await execAsync(`/var/www/${project}/deploy.sh`);
}

GitHubWebhook.use(function timelog(_, __, next) {
  console.log(
    `🎣 Deploy webhook @ ${new Date().toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })} JST`
  );
  next();
});

GitHubWebhook.get("/github", (_, res) => {
  res.send(`${project} GitHub webhooks server is running! ${icon}`);
});

GitHubWebhook.post("/github", function triggerDeploy(req, res) {
  const {
    sender: { login },
    ref,
  } = req.body;
  if (!ref || !login) return console.log(`No ref or sender found in request.`);
  console.log(`Push by ${login} ⇀ ${ref.replace("refs/heads/", "")}`);
  if (ref.indexOf("prod") > -1 && login === username) {
    console.log(`🔩 Triggering ${project} deploy...`);
    deploy();
    res.status(200).send("✅ Deploy has been triggered. ");
  } else res.status(500).send("😵 Deploy was not triggered. ");
});

GitHubWebhook.listen(port, () => {
  console.log(`⚙️  ${project} github server live @ ${uri}`);
});
