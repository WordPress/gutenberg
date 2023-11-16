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
	WordPressComponentProps< TabPanelProps, 'div', false >
>( function TabPanel( { children, id, focusable = true, ...otherProps }, ref ) {
	const context = useTabsContext();
	if ( ! context ) {
		warning(
			'`Tabs.TabPanel` needs to receive context from a `Tabs` component or a `Tabs.Context.Provider`.'
		);
		return null;
	}
	const { store, instanceId } = context;

	return (
		<StyledTabPanel
			ref={ ref }
			store={ store }
			id={ `${ instanceId }-${ id }-view` }
			focusable={ focusable }
			{ ...otherProps }
		>
			{ children }
		</StyledTabPanel>
	);
} );
