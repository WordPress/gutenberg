export interface LoggerItem {
	/** Which logger recorded the message. */
	log: ( ...args: unknown[] ) => void;
	/** What arguments were supplied to the logger. */
	args: unknown[];
}

export interface Logger {
	error: ( ...args: unknown[] ) => void;
	warning: ( ...args: unknown[] ) => void;
	getItems: () => LoggerItem[];
}
