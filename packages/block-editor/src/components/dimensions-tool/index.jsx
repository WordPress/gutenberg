import { useEffect, useRef } from '@wordpress/element';
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
 * @property {string} [width]       CSS width property.
 * @property {string} [height]      CSS height property.
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
 * @return {Element} The dimensions controls.
 */
function DimensionsTool( {
	panelId,
	value = {},
	onChange = () => {},
	aspectRatioOptions, // Default options handled by AspectRatioTool.
	defaultAspectRatio = 'auto', // Match CSS default value for aspect-ratio.
	scaleOptions, // Default options handled by ScaleTool.
	defaultScale = 'cover',
	unitsOptions, // Default options handled by UnitControl.
	tools = [ 'aspectRatio', 'widthHeight', 'scale' ],
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
	const scale = value.scale === undefined ? null : value.scale;

	const hasCustomAspectRatio = !! ( width && height );

	// Keep track of the previous values, so when a value is cleared by means
	// other than directly editing that field, it's easier to restore it. These
	// are only ever read while handling a change, so they're kept in refs and
	// synced from the value to stay correct when it is updated externally, e.g.
	// by undo or by another client.
	const lastScaleRef = useRef( scale );
	const lastAspectRatioRef = useRef( aspectRatio );

	useEffect( () => {
		// Scale is cleared alongside the aspect ratio, so only remember the
		// values it is actually set to.
		if ( scale ) {
			lastScaleRef.current = scale;
		}
	}, [ scale ] );

	useEffect( () => {
		// A custom aspect ratio, i.e. both a width and a height, clears the
		// aspect ratio value. Keep the remembered one so it can be restored
		// once the custom aspect ratio is removed.
		if ( ! hasCustomAspectRatio ) {
			lastAspectRatioRef.current = aspectRatio;
		}
	}, [ aspectRatio, hasCustomAspectRatio ] );

	// 'custom' is not a valid value for CSS aspect-ratio, but it is used in the
	// dropdown to indicate that setting both the width and height is the same
	// as a custom aspect ratio.
	const aspectRatioValue = hasCustomAspectRatio ? 'custom' : aspectRatio;

	const showScaleControl = aspectRatio || ( width && height );

	return (
		<>
			{ tools.includes( 'aspectRatio' ) && (
				<AspectRatioTool
					panelId={ panelId }
					options={ aspectRatioOptions }
					defaultValue={ defaultAspectRatio }
					value={ aspectRatioValue }
					onChange={ ( nextAspectRatio ) => {
						const nextValue = { ...value };

						// 'auto' is CSS default, so it gets treated as null.
						nextAspectRatio =
							nextAspectRatio === 'auto' ? null : nextAspectRatio;

						// Update aspectRatio.
						if ( ! nextAspectRatio ) {
							delete nextValue.aspectRatio;
						} else {
							nextValue.aspectRatio = nextAspectRatio;
						}

						// Auto-update scale.
						if ( ! nextAspectRatio ) {
							delete nextValue.scale;
						} else {
							nextValue.scale =
								lastScaleRef.current ?? defaultScale;
						}

						// Auto-update width and height.
						if ( 'custom' !== nextAspectRatio && width && height ) {
							delete nextValue.height;
						}

						onChange( nextValue );
					} }
				/>
			) }
			{ tools.includes( 'widthHeight' ) && (
				<WidthHeightTool
					panelId={ panelId }
					units={ unitsOptions }
					value={ { width, height } }
					onChange={ ( { width: nextWidth, height: nextHeight } ) => {
						const nextValue = { ...value };

						// 'auto' is CSS default, so it gets treated as null.
						nextWidth = nextWidth === 'auto' ? null : nextWidth;
						nextHeight = nextHeight === 'auto' ? null : nextHeight;

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
						} else if ( lastAspectRatioRef.current ) {
							nextValue.aspectRatio = lastAspectRatioRef.current;
						} else {
							// No setting defaultAspectRatio here, because
							// aspectRatio is optional in this scenario,
							// unlike scale.
						}

						// Auto-update scale.
						if (
							! lastAspectRatioRef.current &&
							!! nextWidth !== !! nextHeight
						) {
							delete nextValue.scale;
						} else {
							nextValue.scale =
								lastScaleRef.current ?? defaultScale;
						}

						onChange( nextValue );
					} }
				/>
			) }
			{ tools.includes( 'scale' ) && showScaleControl && (
				<ScaleTool
					panelId={ panelId }
					options={ scaleOptions }
					defaultValue={ defaultScale }
					value={ scale }
					onChange={ ( nextScale ) => {
						const nextValue = { ...value };

						// Update scale.
						if ( ! nextScale ) {
							delete nextValue.scale;
						} else {
							nextValue.scale = nextScale;
						}

						onChange( nextValue );
					} }
				/>
			) }
		</>
	);
}

export default DimensionsTool;
