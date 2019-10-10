/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function AccessibleToolbar( props ) {
	const toolbar = useToolbarState( { loop: true } );
	const value = useMemo( () => toolbar, Object.values( toolbar ) );
	return (
		<ToolbarContext.Provider value={ value }>
			<Toolbar { ...toolbar } { ...props } />
		</ToolbarContext.Provider>
	);
}

export default AccessibleToolbar;
