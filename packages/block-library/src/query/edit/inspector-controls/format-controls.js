/**
 * WordPress dependencies
 */
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

// All WP post formats, sorted alphabetically by translated name.
// Value is the post format slug. Label is the name.
const POST_FORMATS = [
	{ value: 'aside', label: __( 'Aside' ) },
	{ value: 'audio', label: __( 'Audio' ) },
	{ value: 'chat', label: __( 'Chat' ) },
	{ value: 'gallery', label: __( 'Gallery' ) },
	{ value: 'image', label: __( 'Image' ) },
	{ value: 'link', label: __( 'Link' ) },
	{ value: 'quote', label: __( 'Quote' ) },
	{ value: 'standard', label: __( 'Standard' ) },
	{ value: 'status', label: __( 'Status' ) },
	{ value: 'video', label: __( 'Video' ) },
].sort( ( a, b ) => {
	const normalizedA = a.label.toUpperCase();
	const normalizedB = b.label.toUpperCase();

	if ( normalizedA < normalizedB ) {
		return -1;
	}
	if ( normalizedA > normalizedB ) {
		return 1;
	}
	return 0;
} );

export default function FormatControls( { onChange, query } ) {
	const format = query.format.map( ( item ) => item.toLowerCase() );

	const { supportedFormats } = useSelect( ( select ) => {
		const themeSupports = select( coreStore ).getThemeSupports();
		return {
			supportedFormats: themeSupports.formats,
		};
	}, [] );

	const formats = POST_FORMATS.filter( ( item ) =>
		supportedFormats.includes( item.value )
	);

	const suggestions = formats
		.filter( ( item ) => ! format.includes( item.value ) )
		.map( ( item ) => item.label );

	return (
		<FormTokenField
			label={ __( 'Formats' ) }
			value={ format }
			suggestions={ suggestions }
			onChange={ ( value ) => {
				const normalizedValue = value.map( ( item ) =>
					item.toLowerCase()
				);
				// Only allow the post formats that are in the 'formats' constant.
				const values = normalizedValue.filter( ( item ) =>
					formats.some(
						( supportedFormat ) => supportedFormat.value === item
					)
				);
				onChange( { format: values } );
			} }
			__experimentalShowHowTo={ false }
			__experimentalExpandOnFocus
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	);
}
