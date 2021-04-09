/**
 * Internal dependencies
 */
import { get } from '../../create-styles';
import { flow } from '../presets/flow';
import { BACKGROUND_COLOR_PROPS, G2_COLORS, WORDPRESS_COLORS } from './tokens';
import {
	generateColorAdminColors,
	generateColorDestructiveColors,
	space,
} from './utils';

export const SUPPORTED_COLORS = [
	'blue',
	'red',
	'purple',
	'green',
	'yellow',
	'orange',
	'darkGray',
	'lightGray',
];

const ANIMATION_PROPS = {
	transitionDuration: '200ms',
	transitionDurationFast: '160ms',
	transitionDurationFaster: '120ms',
	transitionDurationFastest: '100ms',
	transitionTimingFunction: 'cubic-bezier(0.08, 0.52, 0.52, 1)',
	transitionTimingFunctionControl: 'cubic-bezier(0.12, 0.8, 0.32, 1)',
};

const COLOR_PROPS = {
	...WORDPRESS_COLORS,
	...BACKGROUND_COLOR_PROPS,
	colorAdmin: '#007cba',
	colorDestructive: '#D94F4F',
	colorBodyBackground: get( 'white' ),
	colorDivider: 'rgba(0, 0, 0, 0.1)',
	colorPositive: get( 'greens' ),
	colorScrollbarThumb: 'rgba(0, 0, 0, 0.2)',
	colorScrollbarThumbHover: 'rgba(0, 0, 0, 0.5)',
	colorScrollbarTrack: 'rgba(0, 0, 0, 0.04)',
	colorText: '#1e1e1e',
	colorTextInverted: get( 'white' ),
	colorTextHeading: '#050505',
	colorTextMuted: '#717171',
	...generateColorAdminColors( '#007cba' ),
	...generateColorDestructiveColors( '#D94F4F' ),
};

const FONT_PROPS = {
	fontFamily:
		'-apple-system, BlinkMacSystemFont,"Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell,"Helvetica Neue", sans-serif',
	fontFamilyMono: 'Menlo, Consolas, monaco, monospace',
	fontSize: '13px',
	fontSizeH1: `calc(2.44 * ${ get( 'fontSize' ) })`,
	fontSizeH2: `calc(1.95 * ${ get( 'fontSize' ) })`,
	fontSizeH3: `calc(1.56 * ${ get( 'fontSize' ) })`,
	fontSizeH4: `calc(1.25 * ${ get( 'fontSize' ) })`,
	fontSizeH5: `calc(1 * ${ get( 'fontSize' ) })`,
	fontSizeH6: `calc(0.8 * ${ get( 'fontSize' ) })`,
	fontSizeInputMobile: '16px',
	fontSizeMobile: '15px',
	fontSizeSmall: `calc(0.92 * ${ get( 'fontSize' ) })`,
	fontSizeXSmall: `calc(0.75 * ${ get( 'fontSize' ) })`,
	fontLineHeightBase: '1.2',
	fontWeight: 'normal',
	fontWeightHeading: '600',
};

const SURFACE_PROPS = {
	surfaceBackgroundColor: get( 'surfaceColor' ),
	surfaceBackgroundSubtleColor: '#F3F3F3',
	surfaceBackgroundTintColor: '#F5F5F5',
	surfaceBorderColor: 'rgba(0, 0, 0, 0.1)',
	surfaceBorderBoldColor: 'rgba(0, 0, 0, 0.15)',
	surfaceBorderSubtleColor: 'rgba(0, 0, 0, 0.05)',
	surfaceBackgroundTertiaryColor: '#ffffff',
	surfaceColor: get( 'white' ),
};

const ELEVATION_PROPS = {
	elevationIntensity: 1,
};

const GRID_PROPS = {
	gridBase: '4px',
};

const CONTROL_PROPS = {
	controlBackgroundColor: get( 'white' ),
	controlBackgroundColorHover: 'rgba(0, 0, 0, 0.05)',
	controlBackgroundColorActive: 'rgba(0, 0, 0, 0.05)',
	controlBackgroundDimColor: 'rgba(0, 0, 0, 0.1)',
	controlBackgroundBrightColor: 'rgba(0, 0, 0, 0.03)',
	controlBorderColor: '#757575',
	controlBorderColorHover: get( 'controlBorderColor' ),
	controlBorderColorSubtle: 'transparent',
	controlBorderRadius: '2px',
	controlBorderSubtleColor: 'rgba(0, 0, 0, 0.2)',
	controlBoxShadowFocusSize: '0.5px',
	controlBoxShadow: `transparent`,
	controlBoxShadowFocus: flow(
		'0 0 0',
		get( 'controlBoxShadowFocusSize' ),
		get( 'colorAdmin' )
	),
	controlPseudoBoxShadowFocusWidth: '2px',
	controlPseudoBoxShadowFocusRingSize: flow.calc(
		get( 'controlPseudoBoxShadowFocusWidth' ),
		'+ 1px +',
		get( 'controlBoxShadowFocusSize' )
	),
	controlPseudoBoxShadowFocusRingSizeSmall: flow.calc(
		get( 'controlPseudoBoxShadowFocusWidth' ),
		'+ 1px'
	),
	controlPseudoBoxShadowFocus: flow(
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusWidth' ),
			get( 'surfaceBackgroundColor' ),
		],
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusRingSize' ),
			get( 'colorAdmin' ),
		]
	),
	controlPseudoBoxShadowFocusSmall: flow(
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusWidth' ),
			get( 'surfaceBackgroundColor' ),
		],
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusRingSizeSmall' ),
			get( 'colorAdmin' ),
		]
	),
	controlDestructivePseudoBoxShadowFocus: flow(
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusWidth' ),
			get( 'surfaceBackgroundColor' ),
		],
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusRingSize' ),
			get( 'colorDestructive' ),
		]
	),
	controlDestructivePseudoBoxShadowFocusSmall: flow(
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusWidth' ),
			get( 'surfaceBackgroundColor' ),
		],
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusRingSizeSmall' ),
			get( 'colorDestructive' ),
		]
	),
	controlDestructiveBorderColor: get( 'colorDestructive' ),
	controlDestructiveBorderColorFocus: get( 'controlDestructiveBorderColor' ),
	controlDestructiveBoxShadowFocus: flow(
		'0 0 0',
		get( 'controlBoxShadowFocusSize' ),
		get( 'colorDestructive' )
	),
	controlHeight: '30px',
	controlHeightLarge: `calc(${ get( 'controlHeight' ) } * 1.2)`,
	controlHeightSmall: `calc(${ get( 'controlHeight' ) } * 0.8)`,
	controlHeightXLarge: `calc(${ get( 'controlHeight' ) } * 1.4)`,
	controlHeightXSmall: `calc(${ get( 'controlHeight' ) } * 0.67)`,
	controlHeightXXSmall: `calc(${ get( 'controlHeight' ) } * 0.4)`,
	controlPaddingX: '12px',
	controlPaddingXLarge: `calc(${ get( 'controlPaddingX' ) } * 1.3334)`,
	controlPaddingXSmall: `calc(${ get( 'controlPaddingX' ) } / 1.3334)`,
	controlPrimaryTextColorActive: get( 'white' ),
	controlPrimaryTextColor: get( 'white' ),
	controlSurfaceBoxShadow: flow(
		[ '0 1px 1px rgba(0, 0, 0, 0.2)' ],
		[ '0 1px 2px rgba(0, 0, 0, 0.2)' ]
	),
	controlSurfaceColor: get( 'white' ),
	controlTextActiveColor: get( 'colorAdmin' ),
	controlInnerControltextColor: get( 'colorAdmin' ),
};

const BUTTON_PROPS = {
	buttonPaddingXRatio: 'calc(4/3)',
	buttonPaddingX: flow.calc(
		get( 'controlPaddingX' ),
		'*',
		get( 'buttonPaddingXRatio' )
	),

	buttonTextColor: get( 'colorAdmin' ),
	buttonTextColorActive: get( 'buttonTextColor' ),

	buttonPrimaryColor: get( 'colorAdmin' ),
	buttonPrimaryColorHover: get( 'buttonPrimaryColor' ),
	buttonPrimaryColorActive: get( 'colorText' ),
	buttonPrimaryColorFocus: get( 'buttonPrimaryColor' ),
	buttonPrimaryBorderColor: get( 'buttonPrimaryColor' ),
	buttonPrimaryBorderColorHover: get( 'buttonPrimaryColor' ),
	buttonPrimaryBorderColorFocus: get( 'buttonPrimaryColor' ),
	buttonPrimaryBorderColorActive: get( 'buttonPrimaryColor' ),
	buttonPrimaryTextColor: get( 'controlPrimaryTextColor' ),
	buttonPrimaryTextColorHover: get( 'controlPrimaryTextColor' ),
	buttonPrimaryTextColorActive: get( 'controlPrimaryTextColor' ),
	buttonPrimaryTextColorFocus: get( 'controlPrimaryTextColor' ),

	buttonSecondaryColor: 'transparent',
	buttonSecondaryColorHover: get( 'buttonSecondaryColor' ),
	buttonSecondaryColorActive: 'rgba(0, 0, 0, 0.05)',
	buttonSecondaryColorFocus: get( 'buttonSecondaryColor' ),
	buttonSecondaryBorderColor: get( 'buttonPrimaryColor' ),
	buttonSecondaryTextColor: get( 'buttonPrimaryColor' ),
	buttonSecondaryTextColorFocus: get( 'buttonPrimaryColor' ),
	buttonSecondaryTextColorActive: get( 'buttonPrimaryColor' ),
	buttonSecondaryBorderColorHover: get( 'buttonPrimaryColor' ),
	buttonSecondaryBorderColorActive: get( 'buttonPrimaryColor' ),
	buttonSecondaryBorderColorFocus: get( 'buttonPrimaryColor' ),

	buttonTertiaryColor: 'transparent',
	buttonTertiaryColorHover: get( 'buttonTertiaryColor' ),
	buttonTertiaryColorActive: 'rgba(0, 0, 0, 0.05)',
	buttonTertiaryColorFocus: get( 'buttonTertiaryColor' ),
	buttonTertiaryBorderColor: 'transparent',
	buttonTertiaryTextColor: get( 'buttonPrimaryColor' ),
	buttonTertiaryTextColorFocus: get( 'buttonPrimaryColor' ),
	buttonTertiaryTextColorActive: get( 'buttonPrimaryColor' ),
	buttonTertiaryBorderColorHover: get( 'buttonPrimaryColor' ),
	buttonTertiaryBorderColorActive: get( 'buttonPrimaryColor' ),
	buttonTertiaryBorderColorFocus: get( 'buttonPrimaryColor' ),

	buttonControlActiveStateColor: get( 'colorText' ),
	buttonControlActiveStateColorHover: get( 'buttonControlActiveStateColor' ),
	buttonControlActiveStateColorActive: get( 'buttonControlActiveStateColor' ),
	buttonControlActiveStateColorFocus: get( 'buttonControlActiveStateColor' ),
	buttonControlActiveStateTextColor: get( 'buttonPrimaryTextColor' ),
	buttonControlActiveStateBorderColorFocus: get( 'buttonPrimaryColor' ),
	buttonControlActiveStateBoxShadowFocus: flow(
		[ '0 0 0', get( 'controlBoxShadowFocusSize' ), get( 'colorAdmin' ) ],
		[
			'0 0 0',
			get( 'controlPseudoBoxShadowFocusWidth' ),
			get( 'buttonControlActiveStateTextColor' ),
			'inset',
		]
	),
};

const CARD_PROPS = {
	cardBorderRadius: '2px',
	cardPaddingX: space( 3 ),
	cardPaddingY: space( 3 ),
	cardPadding: flow( get( 'cardPaddingX' ), get( 'cardPaddingY' ) ),
	cardHeaderFooterPaddingY: space( 1 ),
	cardHeaderHeight: '44px',
};

const CHECKBOX_PROPS = {
	checkboxBoxShadow: 'none',
	checkboxSize: '16px',
};

const FLEX_PROPS = {
	flexGap: space( 2 ),
	flexItemMarginRight: get( 'flexGap' ),
};

const LINK_PROPS = {
	linkColor: get( 'colorAdmin' ),
	linkColorHover: get( 'colorAdmin' ),
	linkColorActive: get( 'colorAdmin' ),
	linkColorFocus: get( 'colorAdmin' ),
};

const MENU_PROPS = {
	menuItemBorderWidth: '1px',
	menuItemFocusBackgroundColor: 'transparent',
	menuItemFocusBorderColor: get( 'colorAdmin' ),
	menuItemFocusTextColor: get( 'menuItemFocusBorderColor' ),
	menuItemFocusBoxShadow: get( 'controlBorderSubtleColor' ),
	menuItemActiveBackgroundColor: get( 'controlBackgroundColor' ),
	menuItemActiveBorderColor: get( 'menuItemFocusBorderColor' ),
	menuItemActiveTextColor: get( 'colorText' ),
	menuItemActiveBoxShadow: get( 'controlBorderSubtleColor' ),
	menuItemHeight: '30px',
	menuItemHeightLarge: `calc(${ get( 'menuItemHeight' ) } * 1.2)`,
	menuItemHeightSmall: `calc(${ get( 'menuItemHeight' ) } * 0.8)`,
	menuItemHeightXLarge: `calc(${ get( 'menuItemHeight' ) } * 1.4)`,
	menuItemHeightXSmall: `calc(${ get( 'menuItemHeight' ) } * 0.67)`,
	menuItemHeightXXSmall: `calc(${ get( 'menuItemHeight' ) } * 0.4)`,
};

const PANEL_PROPS = {
	panelHeaderPadding: `${ space( 3 ) } ${ space( 4 ) }`,
	panelBodyPadding: `${ space( 2 ) } ${ space( 4 ) } ${ space( 3 ) }`,
};

const RADIO_PROPS = {
	radioBoxShadow: get( 'checkboxBoxShadow' ),
	radioSize: get( 'checkboxSize' ),
	radioDotSize: '10px',
};

const SEGMENTED_CONTROL_PROPS = {
	segmentedControlFontSize: '12px',
	segmentedControlBackgroundColor: get( 'controlBackgroundColor' ),
	segmentedControlBorderColor: get( 'controlBorderColor' ),
	segmentedControlBackdropBackgroundColor: get( 'controlSurfaceColor' ),
	segmentedControlBackdropBorderColor: get( 'controlBorderColor' ),
	segmentedControlBackdropBoxShadow: 'transparent',
	segmentedControlButtonColorActive: get( 'controlBackgroundColor' ),
};

const SLIDER_PROPS = {
	sliderThumbBorderColor: 'transparent',
	sliderThumbBoxShadow: 'none',
	sliderThumbBoxShadowSizeFocus: '3px',
	sliderThumbBoxShadowColorFocus: get( 'colorAdminRgba20' ),
	sliderThumbBackgroundColor: get( 'colorAdmin' ),
};

const SWITCH_PROPS = {
	switchBackdropBackgroundColor: get( 'lightGray900' ),
	switchBackdropBackgroundColorActive: get( 'colorAdmin' ),
	switchBackdropBorderColor: get( 'lightGray900' ),
	switchBackdropBorderColorActive: get( 'colorAdmin' ),
	switchBackdropBorderColorFocus: get( 'white' ),
	switchToggleBackgroundColor: get( 'colorTextInverted' ),
	switchToggleBackgroundColorActive: get( 'colorTextInverted' ),
	switchToggleBoxShadow: 'none',
	switchPaddingOffset: '6px',
};

const BASE_THEME = {
	// Colors
	...G2_COLORS,
	...COLOR_PROPS,
	// Base
	...CARD_PROPS,
	...CONTROL_PROPS,
	...ELEVATION_PROPS,
	...FLEX_PROPS,
	...FONT_PROPS,
	...SURFACE_PROPS,
	// Animations
	...ANIMATION_PROPS,
	// The Rest
	...BUTTON_PROPS,
	...CHECKBOX_PROPS,
	...GRID_PROPS,
	...LINK_PROPS,
	...MENU_PROPS,
	...PANEL_PROPS,
	...RADIO_PROPS,
	...SEGMENTED_CONTROL_PROPS,
	...SLIDER_PROPS,
	...SWITCH_PROPS,
};

export const config = BASE_THEME;
