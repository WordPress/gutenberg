/**
 * Internal dependencies
 */
import { Navigator as NavigatorProvider } from './navigator/component';
import { NavigatorScreen } from './navigator-screen/component';
import { NavigatorButton } from './navigator-button/component';
import { NavigatorBackButton } from './navigator-back-button/component';
export { useNavigator } from './use-navigator';

export const Navigator = Object.assign( NavigatorProvider, {
	dislayName: 'Navigator',
	Screen: Object.assign( NavigatorScreen, {
		displayName: 'Navigator.Screen',
	} ),
	Button: Object.assign( NavigatorButton, {
		displayName: 'Navigator.Button',
	} ),
	BackButton: Object.assign( NavigatorBackButton, {
		displayName: 'Navigator.BackButton',
	} ),
} );
