/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function AccessibleToolbar( { accessibilityLabel, ...props } ) {
	const toolbar = useToolbarState( { loop: true } );
	return (
		<ToolbarContext.Provider value={ toolbar }>
			<Toolbar { ...toolbar } aria-label={ accessibilityLabel } { ...props } />
		</ToolbarContext.Provider>
	);
}

export default AccessibleToolbar;
