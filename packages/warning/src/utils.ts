/**
 * Object map tracking messages which have been logged, for use in ensuring a
 * message is only logged once.
 */
export const logged: Set< string > = new Set();
