/**
 * External dependencies
 */
const { upperFirst } = require( 'lodash' );

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
		if ( ! /^[a-z][a-z0-9\-]*$/.test( input ) ) {
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
	choices: [ 'common', 'embed', 'formatting', 'layout', 'widgets' ],
};

module.exports = {
	slug,
	namespace,
	title,
	description,
	dashicon,
	category,
};
