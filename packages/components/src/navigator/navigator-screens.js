/**
 * Internal dependencies
 */
import NavigatorSwitch from './navigator-switch';
import { contextConnect, useContextSystem } from '../ui/context';
import { NavigatorView } from './navigator-styles';

function NavigatorScreens( props, forwardedRef ) {
	const { children, ...otherProps } = useContextSystem(
		props,
		'NavigatorScreens'
	);

	return (
		<NavigatorView { ...otherProps } ref={ forwardedRef }>
			<NavigatorSwitch>{ children }</NavigatorSwitch>
		</NavigatorView>
	);
}

export default contextConnect( NavigatorScreens, 'NavigatorScreens' );
