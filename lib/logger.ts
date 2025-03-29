type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static formatMessage(level: LogLevel, args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    });

    return `${prefix} ${formattedArgs.join(' ')}`;
  }

  private static logToConsole(level: LogLevel, ...args: any[]) {
    const message = this.formatMessage(level, args);

    switch (level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
    }
  }

  static debug(...args: any[]) {
    this.logToConsole('debug', ...args);
  }

  static info(...args: any[]) {
    this.logToConsole('info', ...args);
  }

  static warn(...args: any[]) {
    this.logToConsole('warn', ...args);
  }

  static error(...args: any[]) {
    this.logToConsole('error', ...args);
  }
}

export { Logger };