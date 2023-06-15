/**
 * WordPress dependencies
 */
import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';
import { useSetting } from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AspectRatioTool from './aspect-ratio-tool';
import ScaleTool from './scale-tool';
import WidthHeightTool from './width-height-tool';

/**
 * @typedef {import('@wordpress/components/build-types/select-control/types').SelectControlProps} SelectControlProps
 */

/**
 * @typedef {import('@wordpress/components/build-types/unit-control/types').WPUnitControlUnit} WPUnitControlUnit
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} [width]       CSS width property.
 * @property {number} [height]      CSS height property.
 * @property {string} [scale]       CSS object-fit property.
 * @property {string} [aspectRatio] CSS aspect-ratio property.
 */

/**
 * @callback DimensionsControlsOnChange
 * @param {Dimensions} nextValue
 * @return {void}
 */

/**
 * @typedef {Object} DimensionsControlsProps
 * @property {string}                     [panelId]            ID of the panel that contains the controls.
 * @property {Dimensions}                 [value]              Current dimensions values.
 * @property {DimensionsControlsOnChange} [onChange]           Callback to update the dimensions values.
 * @property {SelectControlProps[]}       [aspectRatioOptions] Aspect ratio options.
 * @property {SelectControlProps[]}       [scaleOptions]       Scale options.
 * @property {WPUnitControlUnit[]}        [unitsOptions]       Units options.
 */

/**
 * Component that renders controls to edit the dimensions of an image or container.
 * @param {DimensionsControlsProps} props The component props.
 * @return {WPElement} The dimensions controls.
 */
function DimensionsControls( {
	panelId,
	value,
	onChange,
	aspectRatioOptions,
	scaleOptions,
	unitsOptions,
} ) {
	// TODO: 'spacing.units` was used in the featured image code, but we're
	// setting width and height, not spacing here, so I'm not sure that's the
	// right thing to use.
	const customUnits = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'%',
			'vw',
			'em',
			'rem',
		],
	} );
	const units = unitsOptions ?? customUnits;

	// 'custom' is not a valid value for CSS aspect-ratio, but it is used in the
	// dropdown to indicate that setting both the width and height is the same
	// as a custom aspect ratio.
	const aspectRatioValue =
		value.width != null && value.height != null
			? 'custom'
			: value.aspectRatio;

	const showScaleControl =
		value.aspectRatio != null ||
		( value.width != null && value.height != null );

	return (
		<>
			<AspectRatioTool
				panelId={ panelId }
				options={ aspectRatioOptions }
				defaultValue="auto"
				value={ aspectRatioValue }
				onChange={ ( nextAspectRatio ) => {
					const { aspectRatio, ...nextValue } = value;

					// 'custom' is not a valid value for CSS aspect-ratio, but it is used in the
					// dropdown to indicate that setting both the width and height is the same
					// as a custom aspect ratio.
					if (
						nextAspectRatio !== 'custom' &&
						nextAspectRatio !== 'auto' &&
						nextAspectRatio != null
					) {
						nextValue.aspectRatio = nextAspectRatio;
					}

					if ( nextAspectRatio === 'auto' ) {
						delete nextValue.scale;
					}

					if ( nextAspectRatio !== 'custom' && value.width != null ) {
						delete nextValue.height;
					}

					// Set the value to 'cover' since CSS uses 'fill' by default.
					if ( nextValue.scale == null ) {
						nextValue.scale = 'cover';
					}

					onChange( nextValue );
				} }
			/>
			<ScaleTool
				panelId={ panelId }
				options={ scaleOptions }
				defaultValue="cover"
				value={ value.scale }
				onChange={ ( nextScale ) => {
					onChange( { ...value, scale: nextScale } );
				} }
				showControl={ showScaleControl }
			/>
			<WidthHeightTool
				panelId={ panelId }
				units={ units }
				value={ { width: value.width, height: value.height } }
				onChange={ ( nextDimension ) => {
					const { width, height, ...nextValue } = value;
					Object.assign( nextValue, nextDimension );

					// Setting both width and height values overrides the aspect ratio.
					if ( nextValue.width != null && nextValue.height != null ) {
						delete nextValue.aspectRatio;

						// Set the value to 'cover' since CSS uses 'fill' by default.
						if ( nextValue.scale == null ) {
							nextValue.scale = 'cover';
						}
					}

					onChange( nextValue );
				} }
			/>
		</>
	);
}

export default DimensionsControls;
