const config = {
  autoReadMessageOption: true,
  storeFilePath: "./store/baileys_store.json",
  sessionFolder: "./session",
  sessionName: process.env.META_SESSION_NAME,
  browserUserAgent: process.env.META_USER_AGENT,
};

module.exports = config;
