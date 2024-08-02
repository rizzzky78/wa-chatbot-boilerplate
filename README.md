<div align="center">

## WhatsApp Chatbot Boilerplate

_Lightweight, Customizable WhatsApp Bot_

<p align="center">
  <a href="https://github.com/rizzzky78"><img title="Author" src="https://img.shields.io/badge/Author-Rizky-blueviolet.svg?style=for-the-badge&logo=github" /></a>
</p>

## [![JavaScript](https://img.shields.io/badge/JavaScript-d6cc0f?style=for-the-badge&logo=javascript&logoColor=white)](https://www.javascript.com) [![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-000000?style=for-the-badge&logo=MongoDB&logoColor=green)](https://www.mongodb.com)

</div>

## Library Used

- @adiwajshing/baileys
- @adiwajshing/keyed-db
- axios
- chalk
- cron
- crypto-random-string
- module-alias
- winston

---

## 💿 Installation

- Install the dependency module (required)

```cmd
$ npm install
```

- Install Nodemon globaly for development mode (required for run in development mode)

```cmd
$ npm install nodemon -g
```

- Install PM2 globaly for run in production mode (required for run in production mode)

```cmd
$ npm install -g pm2
```

- Create and open `.env` file in root aplication, heres the ENV fields look like

```env
META_SESSION_NAME = Chatbot
META_USER_AGENT = Chatbot Development
```

- Run the app using command, or by open `start app.sh` file in the app root.

```cmd
$ node app.js
```

- Scan the QR to login
- Wait until the app configure the login state (eta 2-5 minutes), then close the app using key `CTRL + C` in terminal to terminate app
- Login successful, go to the next step

---

## PM2 Link (required for production mode)

You can link PM2 using **public** and **private** key from official website [PM2 Keymetrics](https://pm2.keymetrics.io/)

- Go to App [PM2 IO](https://app.pm2.io/)
- Create buckets
- Copy the public and private key
- Paste it to terminal

---

## Run in Development Mode (auto restart if has file changes/modify)

Using command, or by open `start development.sh` file in app root.

```cmd
$ npm run dev
```

## Run in Normal Mode (no restart)

Using command, same as initial setup or by open `start app.sh` in app root.

```cmd
$ node app.js
```

## Run in Production Mode (auto restart, online 24 hours)

The production run mode by default using cron restart interval set to 4 hours.

Or, you can modify the app name and restart interval in `ecosystem.config.js`.

```js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

module.exports = {
  apps: [
    {
      name: "Chatbot",
      script: "./app.js",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      cron_restart: "0 */5 * * *", // Cron syntax for every 5 hours
    },
  ],
};
```

Cronjob is set to 5 hours, you can modify the number in `ecosystem.config.js` at app root.

```json
  "scripts": {
    "start": "node app.js --color",
    "production": "pm2 start ecosystem.config.js",
    "dev": "nodemon app.js --color",
    "delete-session": "node ./session/controllers/index.js",
    "commit": "git add . && git commit -m \"minor revision\" && git push",
    "pullrun": "git stash && git pull && node app"
  },
```

Using command to run in production mode, or by open `start production.sh` file in app root.

```cmd
$ npm run prod
```

---

## Command Module

Chatbot has a _module.exports_ that contain module used as command module.

You can find the `type.d.ts` at `./libs/builders/command/index.d.ts`.

```ts
import { WAMessage, WASocket } from "@adiwajshing/baileys";
import { Serialize } from "@libs/utils/serialize";

interface CommandObject {
  /**
   * WA Socket
   */
  client: WASocket;
  /**
   * Whatsapp message metadata
   */
  message: WAMessage;
  /**
   * The used aliases CMD name
   */
  command: string;
  /**
   * Prefix if available
   */
  prefix: string;
  /**
   * The whole Message args that splitted into array
   */
  args: string[];
  /**
   * The whole message args without splitted with CMD key excluded
   */
  fullArgs: string;
  /**
   * WA message serializer
   */
  msg: Serialize;
  /**
   * The whole message args sent by user
   */
  messageBody: string;
}

/**
 * **Command Builder**
 * @description Class command builder
 */
export class ICommand {
  /**
   * @description Command alias
   * @example aliases: ['blabla', 'blabla']
   */
  aliases?: string[];

  /**
   * @required
   * @description Command description
   * @example description: 'Something Downloader'
   */
  description: string;

  /**
   * @description If true and not group and not admin will send forbidden message
   * @example adminOnly: true
   */
  adminOnly?: boolean;

  /**
   * @description If true and not group will send forbidden message
   * @example groupOnly: true
   */
  groupOnly?: boolean;

  /**
   * @description If true and not private will send forbidden message
   * @example privateOnly: true
   */
  privateOnly?: boolean;

  /**
   * @description Minimum argument, for example command without args will send required minimun args message
   * @example minArgs: 1
   */
  minArgs?: number;

  /**
   * @description Example use of the command
   * @example example: '{prefix}{command} [args]'
   */
  exampleArgs?: string;

  /**
   * @description Send waiting message before execute the callback function
   * @example waitMessage: true
   */
  waitMessage?: boolean | string;

  /**
   * @description Cooldown command
   * @example cooldown: 10 * 1000 // 10 seconds
   */
  cooldown?: number;

  /**
   * **Callback Async Function**
   * @required
   * @description Callback to execute command function
   * @example callback: async ({ msg }) => await msg.reply('Hello World!')
   */
  callback: (obj: CommandObject) => Promise<AwaitableMediaMessage>;
}

/**
 * Wrap the CMD module
 */
interface CommandModule extends ICommand {}

/**
 * Typeof promises as pass to baileys WA Socket
 */
interface AwaitableMediaMessage extends VoidFunction {}
```

## Command Module Usage Example

The example use cases for CMD module. CMD module only accept in folder `./commands/...`.

```ts
const moment = require("moment");

/**
 * @type { import('@libs/builders/command').ICommand }
 */
module.exports = {
  aliases: ["ping"],
  callback: async ({ msg, message }) => {
    return msg.reply(
      JSON.stringify(
        {
          ping: `*_${moment
            .duration(
              Date.now() - parseInt(message.messageTimestamp.toString()) * 1000
            )
            .asSeconds()} second(s)_*`,
          raw: message.messageTimestamp.toString(),
        },
        null,
        2
      )
    );
  },
};
```

## End

Special thanks to God, me, and my Computer :)
