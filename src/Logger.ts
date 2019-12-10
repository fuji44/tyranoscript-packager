import winston, { format, transports } from "winston"

export enum Level {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

export class Logger {
  static getDefaultLevel(): Level {
    if (process.env.NODE_ENV === "development") return Level.DEBUG;
    return Level.INFO;
  }

  static createLogger(level?: Level) {
    return winston.createLogger({
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
}
