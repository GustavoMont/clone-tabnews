const { exec } = require("node:child_process");
function checkDb() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(err, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkDb();
      return;
    }
    console.log("\n🎉 Postgres está pronto e aceitando conexões 🎉\n");
  }
}
process.stdout.write("🔴 Aguardando Postgres aceitar conexões");
checkDb();
