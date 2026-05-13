require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const port = Number(process.env.PORT || 3001);

async function start() {
  await sequelize.authenticate();
  app.listen(port, () => {
    console.log(`NCCU AMS credit checker backend listening on ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
