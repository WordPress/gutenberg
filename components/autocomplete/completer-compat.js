/**
 * This mod
 */

/**
 * WordPress dependencies.
 */
import { deprecated } from '@wordpress/utils';

const generateCompleterName = ( () => {
	let count = 0;
	return () => `backcompat-completer-${ count++ }`;
} )();

export function isDeprecatedCompleter( completer ) {
	return 'onSelect' in completer;
}

export function toCompatibleCompleter( deprecatedCompleter ) {
	deprecated( 'Original autocompleter interface in wp.components.Autocomplete', {
		version: '2.8',
		alternative: 'latest autocompleter interface',
		plugin: 'Gutenberg',
		link: 'https://github.com/WordPress/gutenberg/blob/master/components/autocomplete/README.md',
	} );

	const optionalProperties = [ 'className', 'allowNode', 'allowContext' ]
		.filter( ( key ) => key in deprecatedCompleter )
		.reduce( ( properties, key ) => {
			return {
				...properties,
				[ key ]: deprecatedCompleter[ key ],
			};
		}, {} );

	return {
		name: generateCompleterName(),
		triggerPrefix: deprecatedCompleter.triggerPrefix,

		options() {
			return deprecatedCompleter.getOptions();
		},

		getOptionLabel( option ) {
			return option.label;
		},

		getOptionKeywords( option ) {
			return option.keywords;
		},

		getOptionCompletion() {
			return {
				action: 'backcompat',
				value: deprecatedCompleter.onSelect.bind( deprecatedCompleter ),
			};
		},

		...optionalProperties,
	};
}
