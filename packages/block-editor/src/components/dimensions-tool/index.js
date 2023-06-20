/**
 * WordPress dependencies
 */
import { __experimentalUseCustomUnits as useCustomUnits } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';
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
function DimensionsControls( {
	panelId,
	value = {},
	onChange = () => {},
	aspectRatioOptions, // Default value is in AspectRatioTool.
	scaleOptions, // Default value is in ScaleTool.
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

					onChange( nextValue );
				} }
			/>
			{ showScaleControl && (
				<ScaleTool
					panelId={ panelId }
					options={ scaleOptions }
					defaultValue="cover"
					value={ value.scale }
					onChange={ ( nextScale ) => {
						onChange( { ...value, scale: nextScale } );
					} }
				/>
			) }
			<WidthHeightTool
				panelId={ panelId }
				units={ units }
				value={ { width: value.width, height: value.height } }
				onChange={ ( nextDimension ) => {
					const { width, height, ...nextValue } = value;
					Object.assign( nextValue, nextDimension );

					// Setting both width and height values overrides the aspect ratio.
					if (
						nextValue.width !== null &&
						nextValue.width !== undefined &&
						nextValue.height !== null &&
						nextValue.height !== undefined
					) {
						delete nextValue.aspectRatio;

						// Set the value to 'cover' since CSS uses 'fill' by default.
						if (
							nextValue.scale === null ||
							nextValue.scale === undefined
						) {
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
