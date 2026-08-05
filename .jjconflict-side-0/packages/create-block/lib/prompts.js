/**
 * Capitalizes the first letter in a string.
 *
 * @param {string} str The string whose first letter the function will capitalize.
 *
 * @return {string} Capitalized string.
 */
const upperFirst = ( [ firstLetter, ...rest ] ) =>
	firstLetter.toUpperCase() + rest.join( '' );

// Block metadata.
const slug = {
	type: 'input',
	message:
		'The block slug used for identification (also the output folder name):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid block slug specified. Block slug can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const namespace = {
	type: 'input',
	message:
		'The internal namespace for the block name (something unique for your products):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid block namespace specified. Block namespace can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const title = {
	type: 'input',
	message: 'The display title for your block:',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const description = {
	type: 'input',
	message: 'The short description for your block (optional):',
	transformer( input ) {
		return input && upperFirst( input );
	},
};

const dashicon = {
	type: 'input',
	message:
		'The dashicon to make it easier to identify your block (optional):',
	validate( input ) {
		if ( input.length && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid dashicon name specified. Visit https://developer.wordpress.org/resource/dashicons/ to discover available names.';
		}

		return true;
	},
	transformer( input ) {
		return input && input.replace( /dashicon(s)?-/, '' );
	},
};

const category = {
	type: 'select',
	message: 'The category name to help users browse and discover your block:',
	choices: [ 'text', 'media', 'design', 'widgets', 'theme', 'embed' ].map(
		( value ) => ( { value } )
	),
};

const textdomain = {
	type: 'input',
	message:
		'The text domain used to make strings translatable in the block (optional):',
	validate( input ) {
		if ( input.length && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid text domain specified. Text domain can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

// Plugin header fields.
const pluginURI = {
	type: 'input',
	message:
		'The home page of the plugin (optional). Unique URL outside of WordPress.org:',
};

const version = {
	type: 'input',
	message: 'The current version number of the plugin:',
	validate( input ) {
		// Regular expression was copied from https://semver.org.
		const validSemVerPattern =
			/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
		if ( ! validSemVerPattern.test( input ) ) {
			return 'Invalid Semantic Version provided. Visit https://regex101.com/r/vkijKf/1/ to discover all valid patterns.';
		}

		return true;
	},
};

const author = {
	type: 'input',
	message:
		'The name of the plugin author (optional). Multiple authors may be listed using commas:',
};

const license = {
	type: 'input',
	message: 'The short name of the plugin’s license (optional):',
};

const licenseURI = {
	type: 'input',
	message: 'A link to the full text of the license (optional):',
};

const domainPath = {
	type: 'input',
	message: 'A custom domain path for the translations (optional):',
};

const updateURI = {
	type: 'input',
	message: 'A custom update URI for the plugin (optional):',
};

module.exports = {
	slug,
	namespace,
	title,
	description,
	dashicon,
	category,
	textdomain,
	pluginURI,
	version,
	author,
	license,
	licenseURI,
	domainPath,
	updateURI,
};
