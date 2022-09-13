/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function InheritFromTemplate( {
	attributes: {
		query: { inherit },
	},
	setQuery,
} ) {
	return (
		<ToggleControl
			label={ __( 'Inherit query from template' ) }
			help={ __(
				'Toggle to use the global query context that is set with the current template, such as an archive or search. Disable to customize the settings independently.'
			) }
			checked={ !! inherit }
			onChange={ ( value ) => setQuery( { inherit: !! value } ) }
		/>
	);
}
