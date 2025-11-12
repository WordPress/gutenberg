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

// A helper function to convert translatable post format names into their static values.
function formatNamesToValues( names, formats ) {
	return names
		.map( ( name ) => {
			return formats.find(
				( item ) =>
					item.label.toLocaleLowerCase() === name.toLocaleLowerCase()
			)?.value;
		} )
		.filter( Boolean );
}

export default function FormatControls( { onChange, query: { format } } ) {
	// 'format' is expected to be an array. If it is not an array, for example
	// if a user has manually entered an invalid value in the block markup,
	// convert it to an array to prevent JavaScript errors.
	const normalizedFormats = Array.isArray( format ) ? format : [ format ];

	const { supportedFormats } = useSelect( ( select ) => {
		const themeSupports = select( coreStore ).getThemeSupports();
		return {
			supportedFormats: themeSupports.formats,
		};
	}, [] );

	const formats = POST_FORMATS.filter( ( item ) =>
		supportedFormats.includes( item.value )
	);

	const values = normalizedFormats
		.map(
			( name ) => formats.find( ( item ) => item.value === name )?.label
		)
		.filter( Boolean );

	const suggestions = formats
		.filter( ( item ) => ! normalizedFormats.includes( item.value ) )
		.map( ( item ) => item.label );

	return (
		<FormTokenField
			label={ __( 'Formats' ) }
			value={ values }
			suggestions={ suggestions }
			onChange={ ( newValues ) => {
				onChange( {
					format: formatNamesToValues( newValues, formats ),
				} );
			} }
			__experimentalShowHowTo={ false }
			__experimentalExpandOnFocus
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	);
}
