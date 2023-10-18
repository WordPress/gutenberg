/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */

import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabPanelProps } from './types';

import warning from '@wordpress/warning';
import { TabsContext } from './context';

export const TabPanel = forwardRef< HTMLDivElement, TabPanelProps >(
	function TabPanel( { children, id, className, style }, ref ) {
		const context = useContext( TabsContext );
		if ( ! context ) {
			warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
			return null;
		}
		const { store, instanceId } = context;

		return (
			<Ariakit.TabPanel
				ref={ ref }
				style={ style }
				store={ store }
				id={ `${ instanceId }-${ id }-view` }
				className={ className }
			>
				{ children }
			</Ariakit.TabPanel>
		);
	}
);
