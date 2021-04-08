/**
 * Internal dependencies
 */
import { get } from '../../create-styles';
import { DARK_MODE_COLORS, DARK_MODE_RGBA_COLORS } from './tokens';

const DARK_MODE_PROPS = {
	...DARK_MODE_COLORS,
	...DARK_MODE_RGBA_COLORS,
	buttonPrimaryTextColorActive: get( 'controlPrimaryTextColorActive' ),
	buttonControlActiveStateTextColor: get( 'colorTextInverted' ),
	colorBodyBackground: '#18191A',
	colorDivider: 'rgba(255, 255, 255, 0.1)',
	colorScrollbarThumb: 'rgba(255, 255, 255, 0.2)',
	colorScrollbarThumbHover: 'rgba(255, 255, 255, 0.5)',
	colorScrollbarTrack: 'rgba(0, 0, 0, 0.04)',
	colorText: '#E4E6EB',
	colorTextMuted: '#7a7a7a',
	colorTextInverted: '#050505',
	colorTextHeading: '#ffffff',
	controlBackgroundColor: get( 'colorBodyBackground' ),
	controlBackgroundColorHover: 'rgba(255, 255, 255, 0.3)',
	controlBackgroundBrightColor: 'rgba(255, 255, 255, 0.08)',
	controlBackgroundDimColor: 'rgba(255, 255, 255, 0.2)',
	controlBorderSubtleColor: 'rgba(255, 255, 255, 0.5)',
	controlPrimaryTextColorActive: get( 'black' ),
	controlPrimaryTextColor: get( 'white' ),
	controlSurfaceColor: 'rgba(255, 255, 255, 0.3)',
	controlTextActiveColor: get( 'white' ),
	surfaceBackgroundColor: get( 'colorBodyBackground' ),
	surfaceBackgroundSubtleColor: '#151515',
	surfaceBackgroundTintColor: '#252525',
	surfaceBackgroundTertiaryColor: '#000',
	surfaceBorderColor: 'rgba(255, 255, 255, 0.1)',
	surfaceBorderBoldColor: 'rgba(255, 255, 255, 0.15)',
	surfaceBorderSubtleColor: 'rgba(255, 255, 255, 0.05)',
	surfaceColor: '#292929',
};

export const DARK_THEME = {
	...DARK_MODE_PROPS,
};

export const darkModeConfig = DARK_THEME;
