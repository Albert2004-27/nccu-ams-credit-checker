const { sequelize, User } = require("../models");

async function main() {
  await sequelize.authenticate();
  const [user] = await User.findOrCreate({
    where: { student_number: "DEMO001" },
    defaults: {
      name: "示範使用者",
      email: "demo@nccu.edu.tw",
      admission_year: 111
    }
  });
  await user.update({
    name: "示範使用者",
    email: "demo@nccu.edu.tw",
    admission_year: 111
  });
  console.log("Demo user:", user.toJSON());
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
