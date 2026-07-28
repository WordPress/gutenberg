/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

// All WP post formats, sorted alphabetically by translated name.
const POST_FORMATS = [
	{ id: 'aside', caption: __( 'Aside' ) },
	{ id: 'audio', caption: __( 'Audio' ) },
	{ id: 'chat', caption: __( 'Chat' ) },
	{ id: 'gallery', caption: __( 'Gallery' ) },
	{ id: 'image', caption: __( 'Image' ) },
	{ id: 'link', caption: __( 'Link' ) },
	{ id: 'quote', caption: __( 'Quote' ) },
	{ id: 'standard', caption: __( 'Standard' ) },
	{ id: 'status', caption: __( 'Status' ) },
	{ id: 'video', caption: __( 'Video' ) },
].sort( ( a, b ) => {
	const normalizedA = a.caption.toUpperCase();
	const normalizedB = b.caption.toUpperCase();

	if ( normalizedA < normalizedB ) {
		return -1;
	}
	if ( normalizedA > normalizedB ) {
		return 1;
	}
	return 0;
} );

const formatField: Field< BasePost > = {
	id: 'format',
	label: __( 'Format' ),
	type: 'text',
	Edit: 'radio',
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
	getElements: async () => {
		const themeSupports =
			await resolveSelect( coreStore ).getThemeSupports();
		return POST_FORMATS.filter(
			( f ) =>
				( themeSupports?.formats as string[] | undefined )?.includes(
					f.id
				)
		).map( ( f ) => ( { value: f.id, label: f.caption } ) );
	},
};

/**
 * Format field for BasePost.
 */
export default formatField;
