const { FullConfig } = require("@playwright/test");
const dotenv = require('dotenv');

async function globalSetup() {
  dotenv.config({
    path: '.env',
    override: true,
    quiet: true
  });
}

export default globalSetup;