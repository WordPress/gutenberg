/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

const SingleColumnToolsPanelItem = styled( ToolsPanelItem )`
	grid-column: span 1;
`;

export default function WidthHeightTool( {
	panelId,
	value,
	onChange,
	units,
	isShownByDefault = true,
} ) {
	const onDimensionChange = ( dimension ) => ( nextDimension ) => {
		const nextValue = Object.assign( {}, value );
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
				isShownByDefault={ isShownByDefault }
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
