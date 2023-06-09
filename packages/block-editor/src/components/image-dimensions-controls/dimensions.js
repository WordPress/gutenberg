/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

const DEFAULT_UNITS = [ 'px', '%', 'vw', 'em', 'rem' ];

export default function DimensionsItem( {
	panelId,
	value: { width, height },
	onChange,
	availableUnits = DEFAULT_UNITS,
} ) {
	const units = useCustomUnits( { availableUnits } );

	return (
		<>
			<ToolsPanelItem
				hasValue={ () => height != null }
				label={ __( 'Height' ) }
				onDeselect={ () => onChange( { height: undefined } ) }
				resetAllFilter={ () => ( {
					height: undefined,
				} ) }
				isShownByDefault={ true }
				panelId={ panelId }
			>
				<UnitControl
					label={ __( 'Height' ) }
					placeholder={ __( 'Auto' ) }
					labelPosition="top"
					value={ height }
					min={ 0 }
					onChange={ ( nextHeight ) =>
						onChange( { height: nextHeight } )
					}
					units={ units }
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				hasValue={ () => !! width }
				label={ __( 'Width' ) }
				onDeselect={ () => onChange( { width: undefined } ) }
				resetAllFilter={ () => ( {
					width: undefined,
				} ) }
				isShownByDefault={ true }
				panelId={ panelId }
			>
				<UnitControl
					label={ __( 'Width' ) }
					placeholder={ __( 'Auto' ) }
					labelPosition="top"
					value={ width }
					min={ 0 }
					onChange={ ( nextWidth ) =>
						onChange( { width: nextWidth } )
					}
					units={ units }
				/>
			</ToolsPanelItem>
		</>
	);
}
