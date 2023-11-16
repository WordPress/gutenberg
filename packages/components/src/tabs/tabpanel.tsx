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
import type { WordPressComponentProps } from '../context';

export const TabPanel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabPanelProps, 'div', false >
>( function TabPanel( { children, id, focusable = true, ...otherProps }, ref ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
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
