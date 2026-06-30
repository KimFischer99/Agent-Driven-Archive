#!/usr/bin/env node

import { openContributionDb, resolveAgentConfig, sendPendingMails } from "../server/contribution-agent-lib.mjs";

const config = resolveAgentConfig();
const db = openContributionDb(config);
const result = sendPendingMails(db, config);
db.close();

console.log(JSON.stringify({
  ok: true,
  mail_transport: config.mailTransport,
  sent: result.sent,
  failed: result.failed,
}, null, 2));

