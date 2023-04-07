/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RangeControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import {
	InspectorControls,
	withColors,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseGradient,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
	__experimentalUseBorderProps as useBorderProps,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { dimRatioToClass } from './utils';

const Overlay = ( {
	clientId,
	attributes,
	setAttributes,
	overlayColor,
	setOverlayColor,
} ) => {
	const { dimRatio } = attributes;
	const { gradientClass, gradientValue, setGradient } =
		__experimentalUseGradient();
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	const borderProps = useBorderProps( attributes );
	const overlayStyles = {
		backgroundColor: overlayColor.color,
		backgroundImage: gradientValue,
		...borderProps.style,
	};

	return (
		<>
			{ !! dimRatio && (
				<span
					aria-hidden="true"
					className={ classnames(
						'wp-block-post-featured-image__overlay',
						dimRatioToClass( dimRatio ),
						{
							[ overlayColor.class ]: overlayColor.class,
							'has-background-dim': dimRatio !== undefined,
							'has-background-gradient': gradientValue,
							[ gradientClass ]: gradientClass,
						},
						borderProps.className
					) }
					style={ overlayStyles }
				/>
			) }
			<InspectorControls group="color">
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
					/>
				</ToolsPanelItem>
			</InspectorControls>
		</>
	);
};

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
] )( Overlay );
