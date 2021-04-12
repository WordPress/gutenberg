/**
 * Internal dependencies
 */
import { get } from '../../create-styles';
import { rgba } from '../../../utils/colors';

const ANIMATION_PROPS = {
	transitionDuration: '200ms',
	transitionDurationFast: '160ms',
	transitionDurationFaster: '120ms',
	transitionDurationFastest: '100ms',
	transitionTimingFunction: 'cubic-bezier(0.08, 0.52, 0.52, 1)',
	transitionTimingFunctionControl: 'cubic-bezier(0.12, 0.8, 0.32, 1)',
};

const GRAY_COLORS = {
	black: '#000',
	gray900: '#1e1e1e',
	gray700: '#757575',
	gray600: '#949494',
	gray500: '#bbb',
	gray400: '#ccc',
	gray300: '#ddd',
	gray200: '#e0e0e0',
	gray100: '#f0f0f0',
	white: '#fff',
};

const MISC_COLORS = {
	darkThemeFocus: get( 'white' ),
	darkGrayPlaceholder: rgba( GRAY_COLORS.gray900, 0.62 ),
	mediumGrayPlaceholder: rgba( GRAY_COLORS.gray900, 0.55 ),
	lightGrayPlaceholdeR: rgba( GRAY_COLORS.white, 0.65 ),
};

const ALERT_COLORS = {
	alertYellow: '#f0b849',
	alertRed: '#cc1818',
	alertGreen: '#4ab866',
};

const COLOR_PROPS = {
	...GRAY_COLORS,
	...MISC_COLORS,
	...ALERT_COLORS,
	colorAdmin: '#007cba',
	colorDestructive: '#D94F4F',
	colorBodyBackground: get( 'white' ),
	colorText: get( 'gray900' ),
	colorTextInverted: get( 'white' ),
	colorTextHeading: '#050505',
	colorTextMuted: '#717171',
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

const BASE_THEME = {
	...COLOR_PROPS,
	// Base
	...FONT_PROPS,
	// Animations
	...ANIMATION_PROPS,
};

export const config = BASE_THEME;
