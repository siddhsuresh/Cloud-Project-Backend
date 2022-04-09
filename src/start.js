/* eslint strict:"off" */
"use strict";

const { build } = require("./build");

async function start() {
  const app = build({ logger: true, cors: {
    origin: "*"
  } });
  try {
    await app.listen(process.env.PORT || 3000,'0.0.0.0', err => {
      console.log(`server listening on ${app.server.address().port}`)
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
