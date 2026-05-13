const fs = require("fs");
const path = require("path");
const { sequelize, User } = require("../models");
const { importTranscript } = require("../importers/transcriptImport.service");
const { resolveDataFile } = require("../utils/paths");

async function main() {
  const filePath = process.argv[2] ? path.resolve(process.argv[2]) : resolveDataFile("transcript.json");
  await sequelize.authenticate();

  const user = await User.findOne({ where: { student_number: "111302013" } });
  if (!user) throw new Error("Demo user not found. Run npm run seed first.");

  const transcript = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const result = await importTranscript({
    userId: user.id,
    transcript,
    sourceFilename: path.basename(filePath)
  });
  console.log("Imported transcript:", result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
