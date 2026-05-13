const { sequelize, User } = require("../models");

async function main() {
  await sequelize.authenticate();
  const [user] = await User.findOrCreate({
    where: { student_number: "111302013" },
    defaults: {
      name: "吳少華",
      email: "demo@nccu.edu.tw",
      admission_year: 111
    }
  });
  await user.update({
    name: "吳少華",
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
