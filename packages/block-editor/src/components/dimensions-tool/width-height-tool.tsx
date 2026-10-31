import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SizeSuggestionsControl from './size-suggestions-control';
import { getPixelAmount } from './utils';
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
	naturalWidth,
	naturalHeight,
	isShownByDefault = true,
}: WidthHeightToolProps ) {
	// null, undefined, and 'auto' all represent the default value.
	const width = value.width === 'auto' ? '' : ( value.width ?? '' );
	const height = value.height === 'auto' ? '' : ( value.height ?? '' );

	// Sizes are only suggested in pixels, so a value in another unit keeps
	// the field that can edit it.
	const hasNaturalSize = !! naturalWidth && !! naturalHeight;
	const widthPixels = hasNaturalSize ? getPixelAmount( width ) : null;
	const heightPixels = hasNaturalSize ? getPixelAmount( height ) : null;

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
				{ widthPixels !== null ? (
					<SizeSuggestionsControl
						label={ __( 'Width' ) }
						value={ widthPixels }
						onChange={ onDimensionChange( 'width' ) }
						naturalSize={ naturalWidth! }
					/>
				) : (
					<UnitControl
						label={ __( 'Width' ) }
						placeholder={ __( 'Auto' ) }
						labelPosition="top"
						units={ units }
						min={ 0 }
						value={ width }
						onChange={ onDimensionChange( 'width' ) }
					/>
				) }
			</ToolsPanelItem>
			<ToolsPanelItem
				style={ { gridColumn: 'span 1' } }
				label={ __( 'Height' ) }
				isShownByDefault={ isShownByDefault }
				hasValue={ () => height !== '' }
				onDeselect={ onDimensionChange( 'height' ) }
				panelId={ panelId }
			>
				{ heightPixels !== null ? (
					<SizeSuggestionsControl
						label={ __( 'Height' ) }
						value={ heightPixels }
						onChange={ onDimensionChange( 'height' ) }
						naturalSize={ naturalHeight! }
					/>
				) : (
					<UnitControl
						label={ __( 'Height' ) }
						placeholder={ __( 'Auto' ) }
						labelPosition="top"
						units={ units }
						min={ 0 }
						value={ height }
						onChange={ onDimensionChange( 'height' ) }
					/>
				) }
			</ToolsPanelItem>
		</>
	);
}
