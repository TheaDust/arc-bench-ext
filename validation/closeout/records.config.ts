import { defineConfig } from '@playwright/test';
const base=process.env.CLOSEOUT_BASE_URL!;
const projects=[
  ...['sheet-sibling','sheet-nested','sheet-direct'].map(name=>({name,testDir:'../../arc-bench/sheet/tests',testMatch:'REQ-1.1.1.spec.ts',grep:name==='sheet-direct'?/Scenario 1$/:undefined})),
  ...['member-ok','member-role','member-persist','member-access'].map(name=>({name,testDir:'../../arc-bench/github/tests',testMatch:'REQ-2.2.3.spec.ts',grep:name==='member-ok'?undefined:/Scenario 1$/})),
  ...['book-ok','book-uncapped'].map(name=>({name,testDir:'../../arc-bench/bookstack/tests',testMatch:['REQ-7.1.spec.ts','REQ-8.2.spec.ts','REQ-9.1.spec.ts'],
    grep:name==='book-ok'?/Record shelf visit|Reopen visited shelf|Open favorited book|Open recently published page/:/Record shelf visit|Open favorited book|Open recently published page/})),
];
export default defineConfig({workers:1,retries:0,timeout:15000,expect:{timeout:500},use:{browserName:'chromium',actionTimeout:1000},
  reporter:'json',outputDir:'record-oracle-results',projects:projects.map(project=>({...project,use:{baseURL:base+'/'+project.name+'/',extraHTTPHeaders:{'X-Oracle-Mode':project.name}}}))});
