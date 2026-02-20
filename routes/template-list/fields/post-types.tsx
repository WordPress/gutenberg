/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const postTypesField = {
	label: __( 'Post Types' ),
	id: 'post_types',
	getValue: ( { item }: { item: any } ) =>
		item.post_types?.join( ', ' ) || '',
	render: function Render( { item }: { item: any } ) {
		const postTypes = item.post_types;
		if ( ! postTypes || postTypes.length === 0 ) {
			return null;
		}
		return postTypes.join( ', ' );
	},
	enableSorting: false,
};
