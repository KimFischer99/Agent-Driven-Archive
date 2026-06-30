#!/usr/bin/env node

import { openContributionDb, resolveAgentConfig } from "../server/contribution-agent-lib.mjs";

const config = resolveAgentConfig();
const db = openContributionDb(config);
db.close();

console.log(JSON.stringify({
  ok: true,
  db_path: config.dbPath,
}, null, 2));

