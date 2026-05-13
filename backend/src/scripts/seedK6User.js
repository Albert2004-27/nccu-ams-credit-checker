const { sequelize, User } = require("../models");

async function main() {
  await sequelize.authenticate();
  const [user] = await User.findOrCreate({
    where: { student_number: "K6DEMO001" },
    defaults: {
      name: "K6 測試使用者",
      email: "k6-demo@nccu.edu.tw",
      admission_year: 111
    }
  });
  await user.update({
    name: "K6 測試使用者",
    email: "k6-demo@nccu.edu.tw",
    admission_year: 111
  });
  console.log("K6 user:", user.toJSON());
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
