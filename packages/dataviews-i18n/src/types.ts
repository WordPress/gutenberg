/**
 * A single entry of a message catalog.
 *
 * An entry returns the translated message. Messages with placeholders return
 * the format string for the caller to pass to `sprintf`; only plural messages
 * take an argument, because gettext needs the count to pick a form.
 */
export type Message< Args extends unknown[] = [] > = (
	...args: Args
) => string;

/**
 * A catalog entry with any argument list, for constraining a whole catalog.
 */
export type AnyMessage = Message< never[] >;
