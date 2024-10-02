/**
 * External dependencies
 */
import { create } from '@storybook/theming/create';

export default create( {
	base: 'light',
	brandTitle: 'WordPress Components',
	brandImage: './wp-logo@2x.png',

	// Typography
	fontBase:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	fontCode: 'monospace',

	//
	colorPrimary: '#3858E9',
	colorSecondary: '#3858E9',

	// UI
	appBg: '#ffffff',
	appContentBg: '#ffffff',
	appPreviewBg: '#ffffff',
	appBorderColor: '#DCDCDE',
	appBorderRadius: 4,

	// Text colors
	textColor: '#10162F',
	textInverseColor: '#ffffff',

	// Toolbar default and active colors
	barTextColor: '#9E9E9E',
	barSelectedColor: '#3858E9',
	barHoverColor: '#3858E9',
	barBg: '#ffffff',

	// Form colors
	inputBg: '#ffffff',
	inputBorder: '#10162F',
	inputTextColor: '#10162F',
	inputBorderRadius: 2,
} );
