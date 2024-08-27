/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

// All WP post formats, sorted alphabetically by translated name.
const POST_FORMATS = [
	{ slug: 'aside', name: __( 'Aside' ) },
	{ slug: 'audio', name: __( 'Audio' ) },
	{ slug: 'chat', name: __( 'Chat' ) },
	{ slug: 'gallery', name: __( 'Gallery' ) },
	{ slug: 'image', name: __( 'Image' ) },
	{ slug: 'link', name: __( 'Link' ) },
	{ slug: 'quote', name: __( 'Quote' ) },
	{ slug: 'standard', name: __( 'Standard' ) },
	{ slug: 'status', name: __( 'Status' ) },
	{ slug: 'video', name: __( 'Video' ) },
].sort( ( a, b ) => {
	const normalizedA = a.name.toUpperCase();
	const normalizedB = b.name.toUpperCase();

	if ( normalizedA < normalizedB ) {
		return -1;
	}
	if ( normalizedA > normalizedB ) {
		return 1;
	}
	return 0;
} );

export default function FormatControls( { onChange, query } ) {
	const { format } = query;

	const { supportedFormats } = useSelect( ( select ) => {
		const themeSupports = select( coreStore ).getThemeSupports();
		return {
			supportedFormats: themeSupports.formats,
		};
	}, [] );

	const formats = POST_FORMATS.filter( ( item ) =>
		supportedFormats.includes( item.slug )
	);

	const formatOptions = [
		...( formats || [] ).map( ( item ) => ( {
			value: item.slug,
			label: item.name,
		} ) ),
	];

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			multiple
			label={ __( 'Formats' ) }
			value={ format }
			options={ formatOptions }
			onChange={ ( value ) => {
				onChange( { format: value } );
			} }
		/>
	);
}
