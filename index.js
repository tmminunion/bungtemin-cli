#!/usr/bin/env node

const { program } = require("commander");

program.version("1.0.0");

program
  .command("login")
  .description("Login ke server")
  .action(require("./commands/login"));

program
  .command("deploy <file>")
  .description("Deploy function")
  .action(require("./commands/deploy"));

program
  .command("pull")
  .description("Sync functions dari server")
  .action(require("./commands/pull"));
  
program
  .command("list")
  .description("Lihat function di server")
  .action(require("./commands/list"));
  
program
  .command("diff")
  .description("Bandingkan lokal vs server")
  .action(require("./commands/diff"));
  

program.parse(process.argv);
