const messages = {
	create: {
		plugin: 'Creating a new WordPress plugin in the slug directory.',
		block: 'Creating a new block in the slug directory.',
	},
	complete: {
		plugin: 'Done: WordPress plugin title bootstrapped in the slug directory.',
		block: 'Done: Block "title" bootstrapped in the slug directory.',
	},
};

/**
 * Retrieve a message to display in the CLI
 *
 * @param {string}  type         The type of message to retrieve. i.e 'complete'
 * @param {boolean} plugin       A flag to indicate if the message should be plugin or block specific.
 * @param {Object}  placeholders An object of value to replace in the message
 *
 * @return {string} The final message to display
 */
const getMessage = ( type, plugin, placeholders = {} ) => {
	const mode = plugin ? 'plugin' : 'block';
	let message = messages?.[ type ]?.[ mode ];

	if ( typeof message === 'undefined' ) {
		return '';
	}

	for ( const property in placeholders ) {
		message = message.replace(
			new RegExp( property, 'g' ),
			placeholders[ property ]
		);
	}

	return message;
};

module.exports = {
	messages,
	getMessage,
};
