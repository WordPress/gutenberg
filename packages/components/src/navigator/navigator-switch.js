/**
 * External dependencies
 */
import { AnimatePresence } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Route, Switch } from './router';

function NavigatorSwitch( { children } ) {
	return (
		<Route
			render={ ( { location } ) => (
				<AnimatePresence initial={ false } exitBeforeEnter>
					<Switch key={ location.pathname } location={ location }>
						{ children }
					</Switch>
				</AnimatePresence>
			) }
		/>
	);
}

export default memo( NavigatorSwitch );
