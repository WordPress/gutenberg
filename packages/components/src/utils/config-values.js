/**
 * Internal dependencies
 */
import { space } from './space';
import { COLORS } from './colors-values';

const CONTROL_HEIGHT = '36px';

const CONTROL_PROPS = {
	controlSurfaceColor: COLORS.white,
	controlTextActiveColor: COLORS.theme.accent,

	// These values should be shared with TextControl.
	controlPaddingX: 12,
	controlPaddingXSmall: 8,
	controlPaddingXLarge: 12 * 1.3334, // TODO: Deprecate

	controlBackgroundColor: COLORS.white,
	controlBoxShadow: 'transparent',
	controlBoxShadowFocus: `0 0 0 0.5px ${ COLORS.theme.accent }`,
	controlDestructiveBorderColor: COLORS.alert.red,
	controlHeight: CONTROL_HEIGHT,
	controlHeightXSmall: `calc( ${ CONTROL_HEIGHT } * 0.6 )`,
	controlHeightSmall: `calc( ${ CONTROL_HEIGHT } * 0.8 )`,
	controlHeightLarge: `calc( ${ CONTROL_HEIGHT } * 1.2 )`,
	controlHeightXLarge: `calc( ${ CONTROL_HEIGHT } * 1.4 )`,
};

const TOGGLE_GROUP_CONTROL_PROPS = {
	toggleGroupControlBackgroundColor: CONTROL_PROPS.controlBackgroundColor,
	toggleGroupControlBorderColor: COLORS.ui.border,
	toggleGroupControlBackdropBackgroundColor:
		CONTROL_PROPS.controlSurfaceColor,
	toggleGroupControlBackdropBorderColor: COLORS.ui.border,
	toggleGroupControlButtonColorActive: CONTROL_PROPS.controlBackgroundColor,
};

// Using Object.assign to avoid creating circular references when emitting
// TypeScript type declarations.
export default Object.assign( {}, CONTROL_PROPS, TOGGLE_GROUP_CONTROL_PROPS, {
	colorDivider: 'rgba(0, 0, 0, 0.1)',
	colorScrollbarThumb: 'rgba(0, 0, 0, 0.2)',
	colorScrollbarThumbHover: 'rgba(0, 0, 0, 0.5)',
	colorScrollbarTrack: 'rgba(0, 0, 0, 0.04)',
	elevationIntensity: 1,
	radiusXSmall: '1px',
	radiusSmall: '2px',
	radiusMedium: '4px',
	radiusLarge: '8px',
	radiusFull: '9999px',
	radiusRound: '50%',
	borderWidth: '1px',
	borderWidthFocus: '1.5px',
	borderWidthTab: '4px',
	spinnerSize: 16,
	fontSizeXSmall: '11px',
	fontSizeSmall: '12px',
	fontSizeMedium: '13px',
	fontSizeLarge: '15px',
	fontSizeXLarge: '20px',
	fontSize2XLarge: '32px',
	fontSizeH1: '32px', // Todo: consolidate with fontSize properties
	fontSizeH2: '20px', // Todo: consolidate with fontSize properties
	fontSizeH3: '15px', // Todo: consolidate with fontSize properties
	fontSizeH4: '13px', // Todo: consolidate with fontSize properties
	fontSizeH5: '12px', // Todo: consolidate with fontSize properties
	fontSizeH6: '11px', // Todo: consolidate with fontSize properties
	fontSizeInputMobile: '16px',
	fontLineHeightBase: '1.4', // Todo: Deprecate in favor of fontLineHeight tokens
	fontLineHeightXSmall: '16px',
	fontLineHeightSmall: '20px',
	fontLineHeightMedium: '24px',
	fontLineHeightLarge: '28px',
	fontLineHeightXLarge: '32px',
	fontLineHeight2XLarge: '40px',
	fontWeightRegular: '400',
	fontWeightSemiBold: '500',
	fontFamilyHeadings:
		'-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
	fontFamilyBody:
		'-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
	fontFamilyMono: 'Menlo, Consolas, monaco, monospace',
	gridBase: '4px',
	cardPaddingXSmall: `${ space( 2 ) }`,
	cardPaddingSmall: `${ space( 4 ) }`,
	cardPaddingMedium: `${ space( 4 ) } ${ space( 6 ) }`,
	cardPaddingLarge: `${ space( 6 ) } ${ space( 8 ) }`,
	elevationXSmall: `0 1px 1px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02), 0 3px 3px rgba(0, 0, 0, 0.02), 0 4px 4px rgba(0, 0, 0, 0.01)`,
	elevationSmall: `0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 3px rgba(0, 0, 0, 0.04), 0 6px 6px rgba(0, 0, 0, 0.03), 0 8px 8px rgba(0, 0, 0, 0.02)`,
	elevationMedium: `0 2px 3px rgba(0, 0, 0, 0.05), 0 4px 5px rgba(0, 0, 0, 0.04), 0 12px 12px rgba(0, 0, 0, 0.03), 0 16px 16px rgba(0, 0, 0, 0.02)`,
	elevationLarge: `0 5px 15px rgba(0, 0, 0, 0.08), 0 15px 27px rgba(0, 0, 0, 0.07), 0 30px 36px rgba(0, 0, 0, 0.04), 0 50px 43px rgba(0, 0, 0, 0.02)`,
	surfaceBackgroundColor: COLORS.white,
	surfaceBackgroundSubtleColor: '#F3F3F3',
	surfaceBackgroundTintColor: '#F5F5F5',
	surfaceBorderColor: 'rgba(0, 0, 0, 0.1)',
	surfaceBorderBoldColor: 'rgba(0, 0, 0, 0.15)',
	surfaceBorderSubtleColor: 'rgba(0, 0, 0, 0.05)',
	surfaceBackgroundTertiaryColor: COLORS.white,
	surfaceColor: COLORS.white,
	transitionDuration: '200ms',
	transitionDurationFast: '160ms',
	transitionDurationFaster: '120ms',
	transitionDurationFastest: '100ms',
	transitionTimingFunction: 'cubic-bezier(0.08, 0.52, 0.52, 1)',
	transitionTimingFunctionControl: 'cubic-bezier(0.12, 0.8, 0.32, 1)',
} );
