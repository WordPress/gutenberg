/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';
import {
	privateApis as blockEditorPrivateApis,
	useSettings,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	getActiveDimensionValue,
	getDimensionUpdateAttributes,
	getStyleStateKey,
} from '../utils/style-state';
import { unlock } from '../lock-unlock';

const { DimensionsTool } = unlock( blockEditorPrivateApis );

const DEFAULT_SCALE = 'cover';
const DIMENSION_KEYS = [ 'aspectRatio', 'width', 'height', 'scale' ];

const scaleOptions = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for Image dimension control' ),
		help: __(
			'Image is scaled and cropped to fill the entire space without being distorted.'
		),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for Image dimension control' ),
		help: __(
			'Image is scaled to fill the space without clipping nor distorting.'
		),
	},
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for Image dimension control' ),
		help: __(
			'Image will be stretched and distorted to completely fill the space.'
		),
	},
];

const DimensionControls = ( {
	clientId,
	attributes,
	setAttributes,
	selectedStyleState,
	hasSelectedStyleState = false,
} ) => {
	const { style } = attributes;
	const selectedStyleStateKey = getStyleStateKey( selectedStyleState );
	const activeAspectRatio = getActiveDimensionValue( {
		attributes,
		selectedState: selectedStyleState,
		hasSelectedStyleState,
		attributeKey: 'aspectRatio',
	} );
	const activeWidth = getActiveDimensionValue( {
		attributes,
		selectedState: selectedStyleState,
		hasSelectedStyleState,
		attributeKey: 'width',
	} );
	const activeHeight = getActiveDimensionValue( {
		attributes,
		selectedState: selectedStyleState,
		hasSelectedStyleState,
		attributeKey: 'height',
	} );
	const activeScale = getActiveDimensionValue( {
		attributes,
		selectedState: selectedStyleState,
		hasSelectedStyleState,
		attributeKey: 'scale',
		styleKey: 'objectFit',
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ 'px', '%', 'vw', 'em', 'rem' ],
	} );

	const setDimensionAttributes = ( nextDimensions ) => {
		const nextImageDimensions = {
			...nextDimensions,
			width:
				! nextDimensions.width && nextDimensions.height
					? 'auto'
					: nextDimensions.width,
		};

		setAttributes(
			getDimensionUpdateAttributes( {
				style,
				selectedState: selectedStyleState,
				hasSelectedStyleState,
				nextDimensions: nextImageDimensions,
				dimensionKeyMap: { scale: 'objectFit' },
				dimensionKeys: DIMENSION_KEYS,
			} )
		);
	};

	return (
		<DimensionsTool
			key={ selectedStyleStateKey }
			panelId={ clientId }
			value={ {
				aspectRatio: activeAspectRatio,
				width: activeWidth,
				height: activeHeight,
				scale: activeScale,
			} }
			onChange={ setDimensionAttributes }
			defaultScale={ DEFAULT_SCALE }
			defaultAspectRatio="auto"
			scaleOptions={ scaleOptions }
			unitsOptions={ units }
		/>
	);
};

export default DimensionControls;
