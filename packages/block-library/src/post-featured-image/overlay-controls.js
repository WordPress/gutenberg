/**
 * WordPress dependencies
 */
import {
	RangeControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	InspectorControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const OverlayControls = ( { clientId, attributes, setAttributes } ) => {
	const { dimRatio, overlayColor, mediaUrl } = attributes;

	const { gradientValue, setGradient } = __experimentalUseGradient();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	return (
		<InspectorControls __experimentalGroup="color">
			<ColorGradientSettingsDropdown
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				settings={ [
					{
						colorValue: overlayColor,
						gradientValue,
						label: __( 'Overlay' ),
						onColorChange: ( updatedOverlayColor ) =>
							setAttributes( {
								overlayColor: updatedOverlayColor,
							} ),
						onGradientChange: setGradient,
						isShownByDefault: true,
						resetAllFilter: () => ( {
							overlayColor: undefined,
							customOverlayColor: undefined,
							gradient: undefined,
							customGradient: undefined,
						} ),
					},
				] }
				panelId={ clientId }
				{ ...colorGradientSettings }
			/>
			<ToolsPanelItem
				hasValue={ () => {
					// If there's a media background the dimRatio will be
					// defaulted to 50 whereas it will be 100 for colors.
					return dimRatio === undefined
						? false
						: dimRatio !== ( mediaUrl ? 50 : 100 );
				} }
				label={ __( 'Overlay opacity' ) }
				onDeselect={ () =>
					setAttributes( { dimRatio: mediaUrl ? 50 : 100 } )
				}
				resetAllFilter={ () => ( {
					dimRatio: mediaUrl ? 50 : 100,
				} ) }
				isShownByDefault
				panelId={ clientId }
			>
				<RangeControl
					label={ __( 'Overlay opacity' ) }
					value={ dimRatio }
					onChange={ ( newDimRatio ) =>
						setAttributes( {
							dimRatio: newDimRatio,
						} )
					}
					min={ 0 }
					max={ 100 }
					step={ 10 }
					required
				/>
			</ToolsPanelItem>
		</InspectorControls>
	);
};

export default OverlayControls;
