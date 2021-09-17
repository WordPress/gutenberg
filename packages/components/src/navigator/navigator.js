/**
 * Internal dependencies
 */
import NavigatorRouter from './navigator-router';
import { contextConnect, useContextSystem } from '../ui/context';
import { NavigatorContext } from './navigator-context';

function Navigator( props, forwardedRef ) {
	const { animationDuration = 300, children, initialPath } = useContextSystem(
		props,
		'Navigator'
	);

	const contextProps = {
		animationDuration,
	};

	return (
		<NavigatorContext.Provider ref={ forwardedRef } value={ contextProps }>
			<NavigatorRouter initialPath={ initialPath }>
				{ children }
			</NavigatorRouter>
		</NavigatorContext.Provider>
	);
}

export default contextConnect( Navigator, 'Navigator' );
