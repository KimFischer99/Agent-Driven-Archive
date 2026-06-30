#!/usr/bin/env node

import { openContributionDb, resolveAgentConfig, reviewPendingContributions } from "../server/contribution-agent-lib.mjs";

const config = resolveAgentConfig();
const db = openContributionDb(config);
const reviewed = reviewPendingContributions(db, config);
db.close();

console.log(JSON.stringify({
  ok: true,
  reviewer_mode: config.reviewerCommand ? "external-json" : config.reviewerMode,
  reviewed_count: reviewed.length,
  reviewed,
}, null, 2));

