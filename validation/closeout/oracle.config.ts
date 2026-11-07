import { defineConfig } from '@playwright/test';
const base=process.env.CLOSEOUT_BASE_URL!;
const init=/REQ-3\.2\.1:.*Scenario 1$/;
const fork=/REQ-3\.2\.2:.*Scenario 1$/;
const merge=/REQ-6\.5:.*Scenario 1$/;
const refusal=/REQ-6\.5:.*Scenario 2$/;
export default defineConfig({
  testDir:'../../arc-bench/github/tests', testMatch:['REQ-3.2.1.spec.ts','REQ-3.2.2.spec.ts','REQ-6.5.spec.ts'],
  workers:1,retries:0,timeout:6000,expect:{timeout:400},reporter:'json',outputDir:'closeout-results',
  use:{browserName:'chromium',actionTimeout:800},
  projects:[
    {name:'ok',grep:new RegExp([init,fork,merge,refusal].map(r=>r.source).join('|'))},
    {name:'init-history',grep:init},{name:'init-list',grep:init},
    {name:'fork-files',grep:fork},{name:'fork-writeback',grep:fork},
    {name:'merge-status',grep:merge},{name:'merge-parents',grep:merge},{name:'refusal-write',grep:refusal},
  ].map(project=>({...project,use:{baseURL:base+'/'+project.name+'/'}})),
});
