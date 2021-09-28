let previousMessage = '';

/**
 * Filter the message to be announced to the screenreader.
 *
 * @param {string} message The message to be announced.
 *
 * @return {string} The filtered message.
 */
export default function filterMessage( message ) {
	/*
	 * Strip HTML tags (if any) from the message string. Ideally, messages should
	 * be simple strings, carefully crafted for specific use with A11ySpeak.
	 * When re-using already existing strings this will ensure simple HTML to be
	 * stripped out and replaced with a space. Browsers will collapse multiple
	 * spaces natively.
	 */
	message = message.replace( /<[^<>]+>/g, ' ' );

	/*
	 * Safari + VoiceOver don't announce repeated, identical strings. We use
	 * a `no-break space` to force them to think identical strings are different.
	 */
	if ( previousMessage === message ) {
		message += '\u00A0';
	}

	previousMessage = message;

	return message;
}
