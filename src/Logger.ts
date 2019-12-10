import winston, { format, transports } from "winston"

export enum Level {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

export class Logger {
  private static _instance: winston.Logger;

  private constructor() {}

  private static getDefaultLevel(): Level {
    if (process.env.NODE_ENV === "development") return Level.DEBUG;
    return Level.INFO;
  }

  static get instance(): winston.Logger {
    if (! Logger._instance) {
      Logger._instance = winston.createLogger({
        level: Logger.getDefaultLevel(),
        format: format.combine(
          format.colorize({all: true}),
          format.splat(),
          format.timestamp({ format: "YYYY-MM-DDThh:mm:ss.SSSZZ" }),
          format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}] ${message}`;
          })
        ),
        transports: [
          new transports.Console()
        ]
      });
    }
    return Logger._instance;
  }
}
