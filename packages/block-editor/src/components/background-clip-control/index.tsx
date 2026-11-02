import { CustomSelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
		className: `block-editor-background-clip-control__option is-${ option.key }`,
	} ) );

	if ( ! options.length ) {
		return null;
	}

	// Unset is its own option, not the first allowed value.
	const defaultOption = {
		key: 'default',
		name: __( 'Default' ),
		className: 'block-editor-background-clip-control__option is-default',
	};
	const selectedOption =
		options.find( ( option ) => option.key === value ) ?? defaultOption;

	return (
		<CustomSelectControl
			className="block-editor-background-clip-control"
			label={ __( 'Clip' ) }
			options={ [ defaultOption, ...options ] }
			value={ selectedOption }
			onChange={ ( { selectedItem } ) =>
				onChange(
					selectedItem?.key === defaultOption.key
						? undefined
						: selectedItem?.key
				)
			}
		/>
	);
}
