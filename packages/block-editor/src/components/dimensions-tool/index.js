/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

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
 *
 * @param {DimensionsControlsProps} props The component props.
 *
 * @return {WPElement} The dimensions controls.
 */
function DimensionsTool( {
	panelId,
	value = {},
	onChange = () => {},
	aspectRatioOptions, // Default options handled by AspectRatioTool.
	defaultAspectRatio = 'auto', // Match CSS default value for aspect-ratio.
	scaleOptions, // Default options handled by ScaleTool.
	defaultScale = 'fill', // Match CSS default value for object-fit.
	unitsOptions, // Default options handled by UnitControl.
} ) {
	// Coerce undefined and CSS default values to be null.
	const width =
		value.width === undefined || value.width === 'auto'
			? null
			: value.width;
	const height =
		value.height === undefined || value.height === 'auto'
			? null
			: value.height;
	const aspectRatio =
		value.aspectRatio === undefined || value.aspectRatio === 'auto'
			? null
			: value.aspectRatio;
	const scale =
		value.scale === undefined || value.scale === 'fill'
			? null
			: value.scale;

	// Keep track of state internally, so when the value is cleared by means
	// other than directly editing that field, it's easier to restore the
	// previous value.
	const [ lastScale, setLastScale ] = useState( scale );
	const [ lastAspectRatio, setLastAspectRatio ] = useState( aspectRatio );

	// 'custom' is not a valid value for CSS aspect-ratio, but it is used in the
	// dropdown to indicate that setting both the width and height is the same
	// as a custom aspect ratio.
	const aspectRatioValue =
		width !== null && height !== null ? 'custom' : lastAspectRatio;

	const showScaleControl =
		aspectRatio !== null || ( width !== null && height !== null );

	return (
		<>
			<AspectRatioTool
				panelId={ panelId }
				options={ aspectRatioOptions }
				defaultValue={ defaultAspectRatio }
				value={ aspectRatioValue }
				onChange={ ( nextAspectRatio ) => {
					// 'custom' is disabled and hidden, so it should never be
					// passed as a value. However, it should still be displayed
					// if both width and height are set.
					setLastAspectRatio( nextAspectRatio );

					const { ...nextValue } = value;

					// Update aspectRatio.
					if ( nextAspectRatio === 'auto' ) {
						delete nextValue.aspectRatio;
					} else {
						nextValue.aspectRatio = nextAspectRatio;
					}

					// Auto-update scale.
					if ( nextAspectRatio === 'auto' ) {
						delete nextValue.scale;
					} else if ( scale === null ) {
						if ( lastScale === null ) {
							nextValue.scale = defaultScale;
							setLastScale( defaultScale );
						} else {
							nextValue.scale = lastScale;
						}
					}

					// Auto-update width and height.
					if (
						nextAspectRatio !== 'auto' &&
						height !== null &&
						width !== null
					) {
						delete nextValue.height;
					}

					onChange( nextValue );
				} }
			/>
			{ showScaleControl && (
				<ScaleTool
					panelId={ panelId }
					options={ scaleOptions }
					defaultValue={ defaultScale }
					value={ lastScale }
					onChange={ ( nextScale ) => {
						setLastScale( nextScale );

						const { ...nextValue } = value;

						// Update scale.
						if ( nextScale === 'fill' ) {
							// 'fill' is CSS default, so instead of outputting a
							// redundant value, we just remove the property.
							delete nextValue.scale;
						} else {
							nextValue.scale = nextScale;
						}

						onChange( nextValue );
					} }
				/>
			) }
			<WidthHeightTool
				panelId={ panelId }
				units={ unitsOptions }
				value={ { width, height } }
				onChange={ ( nextDimension ) => {
					const nextWidth = nextDimension.width ?? null;
					const nextHeight = nextDimension.height ?? null;

					const { ...nextValue } = value;

					// Update width.
					if ( ! nextWidth ) {
						delete nextValue.width;
					} else {
						nextValue.width = nextWidth;
					}

					// Update height.
					if ( ! nextHeight ) {
						delete nextValue.height;
					} else {
						nextValue.height = nextHeight;
					}

					// Auto-update aspectRatio.
					if ( nextWidth && nextHeight ) {
						delete nextValue.aspectRatio;
					} else if ( lastAspectRatio ) {
						nextValue.aspectRatio = lastAspectRatio;
					}

					// Auto-update scale.
					if ( ! lastAspectRatio && !! nextWidth !== !! nextHeight ) {
						delete nextValue.scale;
					} else if ( lastScale ) {
						nextValue.scale = lastScale;
					} else {
						nextValue.scale = defaultScale;
						setLastScale( defaultScale );
					}

					onChange( nextValue );
				} }
			/>
		</>
	);
}

export default DimensionsTool;
