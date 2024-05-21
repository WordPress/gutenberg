/**
 * WordPress dependencies
 */
import {
	RangeControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	withColors,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseGradient as useGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

const Overlay = ( {
	clientId,
	attributes,
	setAttributes,
	overlayColor,
	setOverlayColor,
} ) => {
	const { dimRatio } = attributes;
	const { gradientValue, setGradient } = useGradient();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	if ( ! colorGradientSettings.hasColorsOrGradients ) {
		return null;
	}

	return (
		<>
			<ColorGradientSettingsDropdown
				__experimentalIsRenderedInSidebar
				settings={ [
					{
						colorValue: overlayColor.color,
						gradientValue,
						label: __( 'Overlay' ),
						onColorChange: setOverlayColor,
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
				hasValue={ () => dimRatio !== undefined }
				label={ __( 'Overlay opacity' ) }
				onDeselect={ () => setAttributes( { dimRatio: 0 } ) }
				resetAllFilter={ () => ( {
					dimRatio: 0,
				} ) }
				isShownByDefault
				panelId={ clientId }
			>
				<RangeControl
					__nextHasNoMarginBottom
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
					__next40pxDefaultSize
				/>
			</ToolsPanelItem>
		</>
	);
};

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
] )( Overlay );
