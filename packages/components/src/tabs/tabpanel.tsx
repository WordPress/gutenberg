/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabPanelProps } from './types';
import { TabPanel as StyledTabPanel } from './styles';

import warning from '@wordpress/warning';
import { TabsContext } from './context';

export const TabPanel = forwardRef< HTMLDivElement, TabPanelProps >(
	function TabPanel(
		{ children, id, className, style, focusable = true },
		ref
	) {
		const context = useContext( TabsContext );
		if ( ! context ) {
			warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
			return null;
		}
		const { store, instanceId } = context;

		return (
			<StyledTabPanel
				focusable={ focusable }
				ref={ ref }
				style={ style }
				store={ store }
				id={ `${ instanceId }-${ id }-view` }
				className={ className }
			>
				{ children }
			</StyledTabPanel>
		);
	}
);
