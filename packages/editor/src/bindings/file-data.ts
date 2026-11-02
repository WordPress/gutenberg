import type { BlockBindingsSource } from '@wordpress/blocks';

/**
 * Gives the URL of the parent File block, so its download button always links
 * to the file. The source has no `setValues`, so the bound URL is read-only.
 */
export default {
	name: 'core/file-data',
	usesContext: [ 'core/file-href' ],
	getValues( {
		context,
		bindings,
	}: {
		context?: Record< string, unknown >;
		bindings: Record< string, unknown >;
	} ) {
		const newValues: Record< string, unknown > = {};
		for ( const attributeName of Object.keys( bindings ) ) {
			newValues[ attributeName ] = context?.[ 'core/file-href' ];
		}
		return newValues;
	},
} satisfies BlockBindingsSource;
