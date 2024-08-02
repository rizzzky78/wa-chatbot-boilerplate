const moment = require("moment");

/**
 * @type { import('@libs/builders/command').ICommand }
 */
module.exports = {
  aliases: ["testing"],
  callback: async ({
    client,
    message,
    msg,
    command,
    args,
    fullArgs,
    messageBody,
  }) => {
    const stringify = JSON.stringify(
      {
        type: "TESTING",
        object: {
          message,
          command,
          args,
          fullArgs,
          messageBody,
        },
      },
      null,
      2
    );
    return await client.sendMessage(msg.from, {
      text: stringify,
    });
  },
};
