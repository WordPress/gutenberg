import {
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

// These should use the same values as AspectRatioDropdown in @wordpress/block-editor
const DEFAULT_ASPECT_RATIO_OPTIONS = [
	{
		label: __( 'Original' ),
		value: 'auto',
	},
	{
		label: __( 'Square - 1:1' ),
		value: '1/1',
	},
	{
		label: __( 'Standard - 4:3' ),
		value: '4/3',
	},
	{
		label: __( 'Portrait - 3:4' ),
		value: '3/4',
	},
	{
		label: __( 'Classic - 3:2' ),
		value: '3/2',
	},
	{
		label: __( 'Classic Portrait - 2:3' ),
		value: '2/3',
	},
	{
		label: __( 'Wide - 16:9' ),
		value: '16/9',
	},
	{
		label: __( 'Tall - 9:16' ),
		value: '9/16',
	},
	{
		label: __( 'Custom' ),
		value: 'custom',
	},
];

function parseAspectRatioCSSValue( value ) {
	// Including 'auto' in the CSS string takes precedence over width/height for
	// replaced elements like the <img> elements that we're dealing with here.
	if ( value.includes( 'auto' ) ) {
		return { width: undefined, height: undefined };
	}
	const [ width, height ] = value.split( '/' ).map( Number );
	return { width, height };
}

function formatAspectRatioCSSValue( width, height ) {
	if ( height === '1' || height === '' ) {
		return `${ width }`;
	}
	return `${ width }/${ height }`;
}

export default function AspectRatioItem( {
	panelId,
	value,
	onChange,
	options = DEFAULT_ASPECT_RATIO_OPTIONS,
	defaultValue = DEFAULT_ASPECT_RATIO_OPTIONS[ 0 ].value,
} ) {
	const { width, height } = parseAspectRatioCSSValue( value );

	// Keep track of state inside so partial updates don't cause onChange to be
	// called with invalid values.
	const [ selectValue, setSelectValue ] = useState(
		options.every( ( option ) => value !== option.value ) ? 'custom' : value
	);
	const [ widthValue, setWidthValue ] = useState( width ?? '' );
	const [ heightValue, setHeightValue ] = useState( height ?? '' );

	return (
		<ToolsPanelItem
			hasValue={ () => value != null && value !== defaultValue }
			label={ __( 'Aspect ratio' ) }
			onDeselect={ () => onChange( defaultValue ) }
			isShownByDefault={ true }
			panelId={ panelId }
		>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Aspect ratio' ) }
				value={ selectValue }
				options={ options }
				onChange={ ( nextValue ) => {
					setSelectValue( nextValue );
					if ( nextValue === 'custom' ) {
						return;
					}
					const parsedNextValue =
						parseAspectRatioCSSValue( nextValue );
					setWidthValue( parsedNextValue.width );
					setHeightValue( parsedNextValue.height );
					onChange( nextValue );
				} }
			/>
			<NumberControl
				label={ __( 'Width' ) }
				placeholder={ __( 'Auto' ) }
				value={ widthValue }
				min={ Number.MIN_VALUE }
				step="any"
				spinControls="none"
				onChange={ ( nextWidth ) => {
					setWidthValue( nextWidth );
					if ( nextWidth === '' && heightValue === '' ) {
						setSelectValue( 'auto' );
						onChange( 'auto' );
					} else if ( nextWidth !== '' ) {
						setSelectValue( 'custom' );
						onChange(
							formatAspectRatioCSSValue( nextWidth, heightValue )
						);
					}
				} }
			/>
			<NumberControl
				label={ __( 'Height' ) }
				placeholder={ __( 'Auto' ) }
				value={ heightValue }
				min={ Number.MIN_VALUE }
				step="any"
				spinControls="none"
				onChange={ ( nextHeight ) => {
					setHeightValue( nextHeight );
					if ( nextHeight === '' && widthValue === '' ) {
						setSelectValue( 'auto' );
						onChange( 'auto' );
					} else if ( nextHeight !== '' ) {
						setSelectValue( 'custom' );
						onChange(
							formatAspectRatioCSSValue( widthValue, nextHeight )
						);
					}
				} }
			/>
		</ToolsPanelItem>
	);
}
