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
	aspectRatioOptions, // Default value is in AspectRatioTool.
	scaleOptions, // Default value is in ScaleTool.
	unitsOptions, // Default value is in UnitControl.
} ) {
	// Keep track of state internally, so when the value is cleared by means
	// other than directly editing that field, it's easier to restore the
	// previous value.
	const [ lastScale, setLastScale ] = useState( value.scale );
	const [ lastAspectRatio, setLastAspectRatio ] = useState(
		value.aspectRatio
	);

	// 'custom' is not a valid value for CSS aspect-ratio, but it is used in the
	// dropdown to indicate that setting both the width and height is the same
	// as a custom aspect ratio.
	const aspectRatioValue =
		value.width !== null &&
		value.width !== undefined &&
		value.height !== null &&
		value.height !== undefined
			? 'custom'
			: value.aspectRatio;

	const showScaleControl =
		( value.aspectRatio !== null && value.aspectRatio !== undefined ) ||
		( value.width !== null &&
			value.width !== undefined &&
			value.height !== null &&
			value.height !== undefined );

	return (
		<>
			<AspectRatioTool
				panelId={ panelId }
				options={ aspectRatioOptions }
				defaultValue="auto"
				value={ aspectRatioValue }
				onChange={ ( nextAspectRatio ) => {
					const { aspectRatio, ...nextValue } = value;

					// 'auto' is CSS default and our default, so setting the
					// new aspect ratio isn't needed. And 'custom' doesn't
					// require an aspect ratio either because with and height
					// are both set overriding any CSS aspect-ratio.
					if (
						nextAspectRatio !== 'custom' &&
						nextAspectRatio !== 'auto' &&
						nextAspectRatio !== null &&
						nextAspectRatio !== undefined
					) {
						nextValue.aspectRatio = nextAspectRatio;
					}

					if (
						nextValue.scale === null ||
						nextValue.scale === undefined
					) {
						// Set the value to 'cover' since CSS uses 'fill' by default.
						nextValue.scale = lastScale ?? 'cover';
					}

					if (
						nextAspectRatio === 'auto' ||
						nextAspectRatio === null ||
						nextAspectRatio === undefined
					) {
						delete nextValue.scale;
					}

					if (
						nextAspectRatio !== 'custom' &&
						value.width !== null &&
						value.width !== undefined
					) {
						delete nextValue.height;
					}

					setLastAspectRatio( nextAspectRatio );
					onChange( nextValue );
				} }
			/>
			{ showScaleControl && (
				<ScaleTool
					panelId={ panelId }
					options={ scaleOptions }
					defaultValue="cover"
					value={ lastScale }
					onChange={ ( nextScale ) => {
						setLastScale( nextScale );
						onChange( { ...value, scale: nextScale } );
					} }
				/>
			) }
			<WidthHeightTool
				panelId={ panelId }
				units={ unitsOptions }
				value={ { width: value.width, height: value.height } }
				onChange={ ( nextDimension ) => {
					const { width, height, ...nextValue } = value;
					Object.assign( nextValue, nextDimension );

					if (
						( nextValue.height !== null &&
							nextValue.height !== undefined ) !==
						( nextValue.width !== null &&
							nextValue.width !== undefined )
					) {
						nextValue.aspectRatio = lastAspectRatio;
					}

					// Setting both width and height values overrides the aspect ratio.
					if (
						nextValue.width !== null &&
						nextValue.width !== undefined &&
						nextValue.height !== null &&
						nextValue.height !== undefined
					) {
						delete nextValue.aspectRatio;
					}

					// Set the value to 'cover' since CSS uses 'fill' by default.
					if (
						nextValue.scale === null ||
						nextValue.scale === undefined
					) {
						nextValue.scale = lastScale ?? 'cover';
					}

					onChange( nextValue );
				} }
			/>
		</>
	);
}

export default DimensionsTool;
