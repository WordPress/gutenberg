/**
 * External dependencies
 */
const { isEmpty, upperFirst } = require( 'lodash' );

// Block metadata.
const slug = {
	type: 'input',
	name: 'slug',
	message:
		'The block slug used for identification (also the plugin and output folder name):',
	validate( input ) {
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid block slug specified. Block slug can contain only lowercase alphanumeric characters or dashes, and start with a letter.';
		}

		return true;
	},
};

const namespace = {
	type: 'input',
	name: 'namespace',
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
	name: 'title',
	message: 'The display title for your block:',
	filter( input ) {
		return input && upperFirst( input );
	},
};

const description = {
	type: 'input',
	name: 'description',
	message: 'The short description for your block (optional):',
	filter( input ) {
		return input && upperFirst( input );
	},
};

const dashicon = {
	type: 'input',
	name: 'dashicon',
	message:
		'The dashicon to make it easier to identify your block (optional):',
	validate( input ) {
		if ( ! isEmpty( input ) && ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
			return 'Invalid dashicon name specified. Visit https://developer.wordpress.org/resource/dashicons/ to discover available names.';
		}

		return true;
	},
	filter( input ) {
		return input && input.replace( /dashicon(s)?-/, '' );
	},
};

const category = {
	type: 'list',
	name: 'category',
	message: 'The category name to help users browse and discover your block:',
	choices: [ 'text', 'media', 'design', 'widgets', 'theme', 'embed' ],
};

// Plugin header fields.
const pluginURI = {
	type: 'input',
	name: 'pluginURI',
	message:
		'The home page of the plugin (optional). Unique URL outside of WordPress.org:',
};

const version = {
	type: 'input',
	name: 'version',
	message: 'The current version number of the plugin:',
	validate( input ) {
		// Regular expression was copied from https://semver.org.
		const validSemVerPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
		if ( ! validSemVerPattern.test( input ) ) {
			return 'Invalid Semantic Version provided. Visit https://regex101.com/r/vkijKf/1/ to discover all valid patterns.';
		}

		return true;
	},
};

const author = {
	type: 'input',
	name: 'author',
	message:
		'The name of the plugin author (optional). Multiple authors may be listed using commas:',
};

const license = {
	type: 'input',
	name: 'license',
	message: 'The short name of the plugin’s license (optional):',
};

const licenseURI = {
	type: 'input',
	name: 'licenseURI',
	message: 'A link to the full text of the license (optional):',
};

const domainPath = {
	type: 'input',
	name: 'domainPath',
	message: 'A custom domain path for the translations (optional):',
};

const updateURI = {
	type: 'input',
	name: 'updateURI',
	message: 'A custom update URI for the plugin (optional):',
};

module.exports = {
	slug,
	namespace,
	title,
	description,
	dashicon,
	category,
	pluginURI,
	version,
	author,
	license,
	licenseURI,
	domainPath,
	updateURI,
};
