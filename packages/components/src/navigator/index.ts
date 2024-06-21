/**
 * Internal dependencies
 */
import { NavigatorProvider } from './navigator-provider';
import { NavigatorScreen } from './navigator-screen';
import { NavigatorButton } from './navigator-button';
import { NavigatorBackButton } from './navigator-back-button';
import { NavigatorToParentButton } from './navigator-to-parent-button';

export {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorBackButton,
	NavigatorToParentButton,
};
export { default as useNavigator } from './use-navigator';

export const Navigator = {
	Root: NavigatorProvider,
	Screen: NavigatorScreen,
	Button: NavigatorButton,
	BackButton: NavigatorBackButton,
	ToParentButton: NavigatorToParentButton,
};
