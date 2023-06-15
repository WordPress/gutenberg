/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	SelectControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useSetting } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * @typedef {import('@wordpress/components/build-types/select-control/types').SelectControlProps} SelectControlProps
 */

/**
 * @typedef {import('@wordpress/components/build-types/unit-control/types').WPUnitControlUnit} WPUnitControlUnit
 */

// These should use the same values as AspectRatioDropdown in @wordpress/block-editor
/**
 * @type {SelectControlProps[]}
 */
const DEFAULT_ASPECT_RATIO_OPTIONS = [
	{
		label: __( 'Original' ),
		value: 'auto',
	},
	{
		label: __( 'Square - 1:1' ),
		value: '1',
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
		disabled: true,
		hidden: true,
	},
];

/**
 * @type {SelectControlProps[]}
 */
const DEFAULT_SCALE_OPTIONS = [
	{
		value: 'cover',
		label: _x( 'Cover', 'Scale option for dimensions control' ),
		help: __(
			'Content is scaled and cropped to fill the entire space without being distorted.'
		),
	},
	{
		value: 'contain',
		label: _x( 'Contain', 'Scale option for dimensions control' ),
		help: __(
			'Content is scaled to fill the space without clipping nor distorting.'
		),
	},
	{
		value: 'fill',
		label: _x( 'Fill', 'Scale option for dimensions control' ),
		help: __(
			'Content will be stretched and distorted to completely fill the space.'
		),
	},
];

const SingleColumnToolsPanelItem = styled( ToolsPanelItem )`
	grid-column: span 1;
`;

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
	aspectRatioOptions = DEFAULT_ASPECT_RATIO_OPTIONS,
	scaleOptions = DEFAULT_SCALE_OPTIONS,
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

	const scaleHelp = useMemo( () => {
		return scaleOptions.reduce( ( acc, option ) => {
			acc[ option.value ] = option.help;
			return acc;
		}, {} );
	}, [ scaleOptions ] );

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

	const onDimensionChange = ( dimension ) => ( nextDimension ) => {
		const nextValue = Object.assign( {}, value );

		if ( nextDimension == null || nextDimension === '' ) {
			delete nextValue[ dimension ];
		} else {
			nextValue[ dimension ] = nextDimension;
		}

		// Setting both width and height values overrides the aspect ratio.
		if ( nextValue.width != null && nextValue.height != null ) {
			delete nextValue.aspectRatio;

			// Set the value to 'cover' since CSS uses 'fill' by default.
			if ( nextValue.scale == null ) {
				nextValue.scale = 'cover';
			}
		}

		onChange( nextValue );
	};

	return (
		<>
			<ToolsPanelItem
				hasValue={ () => aspectRatioValue != null }
				label={ __( 'Aspect ratio' ) }
				onDeselect={ () => {
					const nextValue = Object.assign( {}, value );
					delete nextValue.aspectRatio;
					onChange( nextValue );
				} }
				isShownByDefault
				panelId={ panelId }
			>
				<SelectControl
					label={ __( 'Aspect ratio' ) }
					value={ aspectRatioValue ?? 'auto' }
					options={ aspectRatioOptions }
					onChange={ ( nextAspectRatio ) => {
						const nextValue = Object.assign( {}, value );

						if (
							nextAspectRatio === 'auto' ||
							nextAspectRatio === 'custom'
						) {
							delete nextValue.aspectRatio;
						} else {
							nextValue.aspectRatio = nextAspectRatio;
						}

						if ( nextAspectRatio === 'auto' ) {
							delete nextValue.scale;
						}

						if (
							nextAspectRatio !== 'custom' &&
							value.width != null
						) {
							delete nextValue.height;
						}

						// Set the value to 'cover' since CSS uses 'fill' by default.
						if ( nextValue.scale == null ) {
							nextValue.scale = 'cover';
						}

						onChange( nextValue );
					} }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				label={ __( 'Scale' ) }
				isShownByDefault
				hasValue={ () =>
					value.scale != null && value.scale !== 'cover'
				}
				onDeselect={ () => {
					const nextValue = Object.assign( {}, value );
					nextValue.scale = 'cover';
					onChange( nextValue );
				} }
				panelId={ panelId }
			>
				{ showScaleControl && (
					<ToggleGroupControl
						label={ __( 'Scale' ) }
						isBlock
						// 'fill' is the CSS default, so use it if scale is ever
						// null. The 'fill' value still gets saved in the output
						// unlike the other options which get removed if they
						// are default values because we decided to use 'cover'
						// as the toggle default instead of 'fill'.
						help={ scaleHelp[ value.scale ?? 'fill' ] }
						value={ value.scale ?? 'fill' }
						onChange={ ( nextScale ) => {
							const nextValue = Object.assign( {}, value );
							nextValue.scale = nextScale;
							onChange( nextValue );
						} }
					>
						{ scaleOptions.map( ( option ) => (
							<ToggleGroupControlOption
								key={ option.value }
								{ ...option }
							/>
						) ) }
					</ToggleGroupControl>
				) }
			</ToolsPanelItem>
			<SingleColumnToolsPanelItem
				label={ __( 'Width' ) }
				isShownByDefault
				hasValue={ () => value.width != null }
				onDeselect={ onDimensionChange( 'width' ) }
				panelId={ panelId }
			>
				<UnitControl
					label={ __( 'Width' ) }
					placeholder={ __( 'Auto' ) }
					labelPosition="top"
					units={ units }
					min={ 0 }
					value={ value.width }
					onChange={ onDimensionChange( 'width' ) }
				/>
			</SingleColumnToolsPanelItem>
			<SingleColumnToolsPanelItem
				label={ __( 'Height' ) }
				isShownByDefault
				hasValue={ () => value.height != null }
				onDeselect={ onDimensionChange( 'height' ) }
				panelId={ panelId }
			>
				<UnitControl
					label={ __( 'Height' ) }
					placeholder={ __( 'Auto' ) }
					labelPosition="top"
					units={ units }
					min={ 0 }
					value={ value.height }
					onChange={ onDimensionChange( 'height' ) }
				/>
			</SingleColumnToolsPanelItem>
		</>
	);
}

export default DimensionsControls;
