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
