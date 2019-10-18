/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * Internal dependencies
 */
import ToolbarContext from './toolbar-context';

function ToolbarContainer( { accessibilityLabel, ...props } ) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	const toolbarState = useToolbarState( { loop: true } );

	return (
		<ToolbarContext.Provider value={ toolbarState }>
			<Toolbar { ...toolbarState } aria-label={ accessibilityLabel } { ...props } />
		</ToolbarContext.Provider>
	);
}

export default ToolbarContainer;
