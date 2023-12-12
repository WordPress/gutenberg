/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabPanelProps } from './types';
import { TabPanel as StyledTabPanel } from './styles';

import warning from '@wordpress/warning';
import { useTabsContext } from './context';
import type { WordPressComponentProps } from '../context';

export const TabPanel = forwardRef<
	HTMLDivElement,
	Omit< WordPressComponentProps< TabPanelProps, 'div', false >, 'id' >
>( function TabPanel(
	{ children, tabId, focusable = true, ...otherProps },
	ref
) {
	const context = useTabsContext();
	if ( ! context ) {
		warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;
	const instancedTabId = `${ instanceId }-${ tabId }`;

	return (
		<StyledTabPanel
			ref={ ref }
			store={ store }
			id={ instancedTabId }
			focusable={ focusable }
			{ ...otherProps }
		>
			{ children }
		</StyledTabPanel>
	);
} );
