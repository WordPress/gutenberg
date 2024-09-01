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
	fontSize: '13px',
	fontSizeH1: 'calc(2.44 * 13px)',
	fontSizeH2: 'calc(1.95 * 13px)',
	fontSizeH3: 'calc(1.56 * 13px)',
	fontSizeH4: 'calc(1.25 * 13px)',
	fontSizeH5: '13px',
	fontSizeH6: 'calc(0.8 * 13px)',
	fontSizeInputMobile: '16px',
	fontSizeMobile: '15px',
	fontSizeSmall: 'calc(0.92 * 13px)',
	fontSizeXSmall: 'calc(0.75 * 13px)',
	fontLineHeightBase: '1.4',
	fontWeight: 'normal',
	fontWeightHeading: '600',
	gridBase: '4px',
	cardBorderRadius: '2px',
	cardPaddingXSmall: `${ space( 2 ) }`,
	cardPaddingSmall: `${ space( 4 ) }`,
	cardPaddingMedium: `${ space( 4 ) } ${ space( 6 ) }`,
	cardPaddingLarge: `${ space( 6 ) } ${ space( 8 ) }`,
	elevationXSmall: `0 0.7px 1px rgba(0, 0, 0, 0.1), 0 1.2px 1.7px -0.2px rgba(0, 0, 0, 0.1), 0 2.3px 3.3px -0.5px rgba(0, 0, 0, 0.1)`,
	elevationSmall: `0 0.7px 1px 0 rgba(0, 0, 0, 0.12), 0 2.2px 3.7px -0.2px rgba(0, 0, 0, 0.12), 0 5.3px 7.3px -0.5px rgba(0, 0, 0, 0.12)`,
	elevationMedium: `0 0.7px 1px 0 rgba(0, 0, 0, 0.14), 0 4.2px 5.7px -0.2px rgba(0, 0, 0, 0.14), 0 7.3px 9.3px -0.5px rgba(0, 0, 0, 0.14)`,
	elevationLarge: `0 0.7px 1px rgba(0, 0, 0, 0.15), 0 2.7px 3.8px -0.2px rgba(0, 0, 0, 0.15), 0 5.5px 7.8px -0.3px rgba(0, 0, 0, 0.15), 0.1px 11.5px 16.4px -0.5px rgba(0, 0, 0, 0.15)`,
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
