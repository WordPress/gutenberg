/**
 * WordPress dependencies
 */
import { memo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useNavigatorHistory } from './navigator-hooks';
import { MemoryRouter } from './router';

function NavigatorRouter( { children, initialPath } ) {
	const history = useNavigatorHistory();
	// Would only exist if nested within another <Navigator />
	const location = history?.location;

	// Redirect on load
	useEffect( () => {} );

	// No parent router
	if ( ! location ) {
		const initialEntry = initialPath ? [ initialPath ] : undefined;

		return (
			<MemoryRouter initialEntries={ initialEntry }>
				{ children }
			</MemoryRouter>
		);
	}

	return children;
}

export default memo( NavigatorRouter );
