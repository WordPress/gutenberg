import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { WidthHeightToolProps, WidthHeightToolValue } from './types';

/**
 * Component that renders controls to edit the dimensions of an image or container.
 *
 * @param {WidthHeightToolProps} props The component props.
 *
 * @return The width and height tool.
 */
export default function WidthHeightTool( {
	panelId,
	value = {},
	onChange = () => {},
	units,
	isShownByDefault = true,
}: WidthHeightToolProps ) {
	// null, undefined, and 'auto' all represent the default value.
	const width = value.width === 'auto' ? '' : ( value.width ?? '' );
	const height = value.height === 'auto' ? '' : ( value.height ?? '' );

	const onDimensionChange =
		( dimension: keyof WidthHeightToolValue ) =>
		( nextDimension?: string ) => {
			const nextValue: WidthHeightToolValue = { ...value };
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
			<ToolsPanelItem
				style={ { gridColumn: 'span 1' } }
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
				/>
			</ToolsPanelItem>
			<ToolsPanelItem
				style={ { gridColumn: 'span 1' } }
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
				/>
			</ToolsPanelItem>
		</>
	);
}
