/**
 * @module WAConnection
 * @description Core module for WhatsApp connection using Baileys
 */

const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestWaWebVersion,
} = require("@adiwajshing/baileys");
const logger = require("./utils/logger");
const { messageHandler } = require("./handlers");
const { Boom } = require("@hapi/boom");
const { existsSync } = require("fs");
const store = require("@store");
const pino = require("pino");

const {
  storeFilePath,
  sessionFolder,
  sessionName,
  browserUserAgent,
} = require("@settings/config");

/** Maximum number of connection attempts before terminating */
const MAX_CONNECTION_ATTEMPTS = 20;
/** Path to the Baileys store file */
const STORE_FILE_PATH = storeFilePath;
/** Path to the session folder */
const SESSION_FOLDER = sessionFolder;

// Load and periodically save store
if (existsSync(STORE_FILE_PATH)) {
  store.readFromFile(STORE_FILE_PATH);
}
setInterval(() => store.writeToFile(STORE_FILE_PATH), 60_000);

/**
 * Creates a WhatsApp socket connection
 * @async
 * @returns {Promise<{client: import('@adiwajshing/baileys').WASocket, saveCreds: () => Promise<void>}>} The WhatsApp socket connection and saveCreds function
 */
async function createWASocket() {
  const { state, saveCreds } = await useMultiFileAuthState(
    `${SESSION_FOLDER}/${sessionName}-session`
  );
  const { version, isLatest } = await fetchLatestWaWebVersion().catch(() =>
    fetchLatestBaileysVersion()
  );

  logger.info(`WA Version: ${version}. Is Latest: ${isLatest}`);

  const client = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS(browserUserAgent),
    version,
  });

  return { client, saveCreds };
}

/**
 * Handles connection updates
 * @param {import('@adiwajshing/baileys').WASocket} client The WhatsApp client
 * @param {import('@adiwajshing/baileys').BaileysEventMap['connection.update']} update The connection update
 * @param {number} connectionAttempts The number of connection attempts
 */
function handleConnectionUpdate(client, update, connectionAttempts) {
  const { lastDisconnect, connection, qr } = update;

  if (qr) {
    logger.info("Please scan QR Code to connect");
  }

  if (connection) {
    logger.info(`Connection Status: ${connection}`);
  }

  if (connection === "close") {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

    switch (reason) {
      case DisconnectReason.badSession:
        logger.error(
          `Bad Session File, Please Delete ${SESSION_FOLDER}/${sessionName}-session and Scan Again`
        );
        client.logout();
        break;
      case DisconnectReason.connectionClosed:
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
        if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
          logger.error(
            "Exceeded maximum connection attempts. Terminating the app."
          );
          process.exit(1);
        } else {
          logger.error("Connection lost, reconnecting...");
          connect(connectionAttempts + 1);
        }
        break;
      case DisconnectReason.connectionReplaced:
        logger.error(
          "Connection Replaced, Another New Session Opened, Please Close Current Session First"
        );
        client.logout();
        break;
      case DisconnectReason.loggedOut:
        logger.error(
          `Device Logged Out, Please Delete ${SESSION_FOLDER}/${sessionName}-session and Scan Again.`
        );
        client.logout();
        break;
      case DisconnectReason.restartRequired:
        logger.error("Restart Required, Restarting...");
        connect();
        break;
      default:
        client.end(
          new Error(
            `Unknown DisconnectReason: ${reason}|${lastDisconnect?.error}`
          )
        );
    }
  }
}

/**
 * Establishes and manages the WhatsApp connection
 * @async
 * @param {number} [connectionAttempts=0] The number of connection attempts
 */
async function connect(connectionAttempts = 0) {
  const { client, saveCreds } = await createWASocket();
  logger.info(`Using metadata session : ${browserUserAgent}/${sessionName}`);

  store.bind(client.ev);

  client.ev.on("chats.set", () =>
    logger.info(`Got ${store.chats.all().length} chats`)
  );
  client.ev.on("contacts.set", () =>
    logger.info(`Got ${Object.values(store.contacts).length} contacts`)
  );
  client.ev.on("creds.update", saveCreds);
  client.ev.on("connection.update", (update) =>
    handleConnectionUpdate(client, update, connectionAttempts)
  );
  client.ev.on("messages.upsert", ({ messages, type }) => {
    if (type === "notify") {
      messageHandler(client, { messages, type });
    }
  });
}

module.exports = { connect };
