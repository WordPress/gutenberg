/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */

import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabPanelProps } from './types';

import warning from '@wordpress/warning';
import { TabsContext } from './context';

function TabPanel( { children, id, className, style }: TabPanelProps ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;

	return (
		<Ariakit.TabPanel
			style={ style }
			store={ store }
			id={ `${ instanceId }-${ id }-view` }
			className={ className }
		>
			{ children }
		</Ariakit.TabPanel>
	);
}

export default TabPanel;
