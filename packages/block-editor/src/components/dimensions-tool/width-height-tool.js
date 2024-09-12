/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SingleColumnToolsPanelItem = styled( ToolsPanelItem )`
	grid-column: span 1;
`;

/**
 * @typedef {import('@wordpress/components/build-types/unit-control/types').WPUnitControlUnit} WPUnitControlUnit
 */

/**
 * @typedef {Object} WidthHeightToolValue
 * @property {string} [width]  Width CSS value.
 * @property {string} [height] Height CSS value.
 */

/**
 * @callback WidthHeightToolOnChange
 * @param {WidthHeightToolValue} nextValue Next dimensions value.
 * @return {void}
 */

/**
 * @typedef {Object} WidthHeightToolProps
 * @property {string}                  [panelId]          ID of the panel that contains the controls.
 * @property {WidthHeightToolValue}    [value]            Current dimensions values.
 * @property {WidthHeightToolOnChange} [onChange]         Callback to update the dimensions values.
 * @property {WPUnitControlUnit[]}     [units]            Units options.
 * @property {boolean}                 [isShownByDefault] Whether the panel is shown by default.
 */

/**
 * Component that renders controls to edit the dimensions of an image or container.
 *
 * @param {WidthHeightToolProps} props The component props.
 *
 * @return {import('react').ReactElement} The width and height tool.
 */
export default function WidthHeightTool( {
	panelId,
	value = {},
	onChange = () => {},
	units,
	isShownByDefault = true,
} ) {
	// null, undefined, and 'auto' all represent the default value.
	const width = value.width === 'auto' ? '' : value.width ?? '';
	const height = value.height === 'auto' ? '' : value.height ?? '';

	const onDimensionChange = ( dimension ) => ( nextDimension ) => {
		const nextValue = { ...value };
		// Empty strings or undefined may be passed and both represent removing the value.
		if ( ! nextDimension ) {
			delete nextValue[ dimension ];
		} else {
			nextValue[ dimension ] = nextDimension;
		}
		onChange( nextValue );
	};

	return (
		<>
			<SingleColumnToolsPanelItem
				label={ __( 'Width' ) }
				isShownByDefault={ isShownByDefault }
				hasValue={ () => width !== '' }
				onDeselect={ onDimensionChange( 'width' ) }
				panelId={ panelId }
			>
				<UnitControl
					label={ __( 'Width' ) }
					placeholder={ __( 'Auto' ) }
					labelPosition="top"
					units={ units }
					min={ 0 }
					value={ width }
					onChange={ onDimensionChange( 'width' ) }
					size="__unstable-large"
				/>
			</SingleColumnToolsPanelItem>
			<SingleColumnToolsPanelItem
				label={ __( 'Height' ) }
				isShownByDefault={ isShownByDefault }
				hasValue={ () => height !== '' }
				onDeselect={ onDimensionChange( 'height' ) }
				panelId={ panelId }
			>
				<UnitControl
					label={ __( 'Height' ) }
					placeholder={ __( 'Auto' ) }
					labelPosition="top"
					units={ units }
					min={ 0 }
					value={ height }
					onChange={ onDimensionChange( 'height' ) }
					size="__unstable-large"
				/>
			</SingleColumnToolsPanelItem>
		</>
	);
}
