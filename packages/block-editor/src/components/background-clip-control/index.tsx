import { CustomSelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { VALID_BACKGROUND_CLIP_VALUES } from '@wordpress/style-engine';

// Re-exported under the name the panels use. The style engine owns the list,
// since it is what decides which values produce CSS.
export const ALL_BACKGROUND_CLIP_VALUES = VALID_BACKGROUND_CLIP_VALUES;

const BACKGROUND_CLIP_OPTIONS = [
	{ key: 'border-box', name: __( 'Border box' ) },
	{ key: 'padding-box', name: __( 'Padding box' ) },
	{ key: 'content-box', name: __( 'Content box' ) },
	{ key: 'text', name: __( 'Text' ) },
];

interface BackgroundClipControlProps {
	value?: string;
	onChange: ( value?: string ) => void;
	allowedValues?: string[];
}

export default function BackgroundClipControl( {
	value,
	onChange,
	allowedValues,
}: BackgroundClipControlProps ) {
	const options = (
		allowedValues
			? BACKGROUND_CLIP_OPTIONS.filter( ( option ) =>
					allowedValues.includes( option.key )
				)
			: BACKGROUND_CLIP_OPTIONS
	).map( ( option ) => ( {
		...option,
		// The preview swatch for each value is drawn from this modifier.
		className: `block-editor-background-clip-control__option is-${ option.key }`,
	} ) );

	if ( ! options.length ) {
		return null;
	}

	// `border-box` is the CSS initial value, so it stands in when nothing is set.
	const selectedOption =
		options.find( ( option ) => option.key === value ) ?? options[ 0 ];

	return (
		<CustomSelectControl
			className="block-editor-background-clip-control"
			label={ __( 'Clip' ) }
			options={ options }
			value={ selectedOption }
			onChange={ ( { selectedItem } ) => onChange( selectedItem?.key ) }
		/>
	);
}
