/**
 * @module MessageHandler
 * @description Core message handling module for WhatsApp bot
 */

const { commands } = require("@libs/constants/command");
const { cooldown } = require("@libs/utils/cooldown");
const chalk = require("chalk");
const { getContentType, proto } = require("@adiwajshing/baileys");
const { serialize } = require("@libs/utils/serialize");
const moment = require("moment-timezone");
const logger = require("@libs/utils/logger");

/** Whether to automatically mark messages as read */
const AUTO_READ_MESSAGES = true;

/**
 * Extracts the message body from various message types
 * @param {proto.IWebMessageInfo} message - The message object
 * @returns {string|null} The extracted message body or null if not found
 */
function extractMessageBody(message) {
  const messageTypes = [
    "conversation",
    "imageMessage",
    "videoMessage",
    "extendedTextMessage",
    "buttonsResponseMessage",
    "listResponseMessage",
    "templateButtonReplyMessage",
  ];

  for (const type of messageTypes) {
    if (message[type]?.text || message[type]?.caption) {
      return message[type].text || message[type].caption;
    }
  }

  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return message.listResponseMessage.singleSelectReply.selectedRowId;
  }

  if (message.buttonsResponseMessage?.selectedButtonId) {
    return message.buttonsResponseMessage.selectedButtonId;
  }

  if (message.templateButtonReplyMessage?.selectedId) {
    return message.templateButtonReplyMessage.selectedId;
  }

  return null;
}

/**
 * Checks if the command is allowed to be executed
 * @param {import("@libs/builders/command").CommandModule} command - The command object
 * @param {import("@libs/utils/serialize").Serialize} msg - The message object
 * @returns {boolean} Whether the command is allowed
 */
function isCommandAllowed(command, msg) {
  if (command.groupOnly && !msg.isGroup) return false;
  if (command.privateOnly && msg.isGroup) return false;
  if (command.adminOnly && !msg.isGroupAdmin) return false;
  return true;
}

/**
 * Handles the cooldown for commands
 * @param {import("@libs/builders/command").CommandModule} command - The command object
 * @param {string} cooldownKey - The cooldown key
 * @param {Function} replyFunction - The function to send a reply
 * @returns {boolean} Whether the command is on cooldown
 */
function handleCooldown(command, cooldownKey, replyFunction) {
  if (!command.cooldown) return false;

  const cooldownTime = cooldown.get(cooldownKey);
  if (cooldownTime && cooldownTime > moment()) {
    const duration = moment.duration(cooldownTime.diff(moment()));
    const seconds = Math.round(duration.asSeconds());
    replyFunction(`Command is on cooldown. Please wait ${seconds} seconds.`);
    return true;
  }

  cooldown.set(cooldownKey, moment().add(moment.duration(command.cooldown)));
  setTimeout(() => cooldown.delete(cooldownKey), command.cooldown);
  return false;
}

/**
 * Logs the command execution
 * @param {string} command - The command name
 * @param {import("@libs/utils/serialize").Serialize} msg - The message object
 */
function logCommandExecution(command, msg) {
  const logParts = [
    chalk.whiteBright(`[${new Date().toISOString()}]`),
    chalk.yellowBright("[COMMAND]:"),
    chalk.magentaBright(command),
    chalk.greenBright("from"),
    chalk.cyanBright(
      `${msg.pushName} | ${msg.senderNumber.substring(0, 9)}xxx`
    ),
  ];

  if (msg.isGroup) {
    logParts.push(
      chalk.greenBright("in"),
      chalk.yellow(msg.groupMetadata.subject)
    );
  }

  console.log(logParts.join(" "));
}

/**
 * Core Message Handler
 * @type { import("./types").MessageHandler }
 */
async function MessageHandler(client, { messages, type }) {
  const message = messages[0];
  if (message.key && message.key.remoteJid === "status@broadcast") return;
  if (!message.message) return;

  message.type = getContentType(message.message);
  if (
    ["protocolMessage", "senderKeyDistributionMessage"].includes(
      message.type
    ) ||
    !message.type
  )
    return;

  const messageBody = extractMessageBody(message.message) || "";
  const msg = await serialize(message, client);

  if (AUTO_READ_MESSAGES) {
    client.readMessages([message.key]);
  }

  const [command, ...args] = messageBody.trim().split(/ +/);
  const fullArgs = messageBody.slice(command.length).trim();
  const messageArgs = msg.body || null;

  const commandObject =
    commands.get(command.toLowerCase()) ||
    commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(command.toLowerCase())
    );

  if (!commandObject) return;
  if (!isCommandAllowed(commandObject, msg)) return;

  logCommandExecution(command, msg);

  const cooldownKey = `${msg.senderNumber}-${command}`;
  if (handleCooldown(commandObject, cooldownKey, msg.reply.bind(msg))) return;

  if (commandObject.waitMessage) {
    await msg.reply(
      typeof commandObject.waitMessage === "string"
        ? commandObject.waitMessage
        : "Please wait..."
    );
  }

  try {
    await commandObject.callback({
      client,
      message,
      msg,
      command,
      args,
      fullArgs,
      messageBody,
    });
  } catch (error) {
    logger.error(`Error executing command ${command}:`, error);
    await msg.reply("An error occurred while executing the command.");
  }
}

module.exports = MessageHandler;
