/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabListProps } from './types';
import { useTabsContext } from './context';
import { TabListWrapper } from './styles';

export const TabList = forwardRef< HTMLDivElement, TabListProps >(
	function TabList( { children, className, style }, ref ) {
		const context = useTabsContext();
		if ( ! context ) {
			warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
			return null;
		}
		const { store } = context;
		return (
			<Ariakit.TabList
				ref={ ref }
				style={ style }
				store={ store }
				className={ className }
				render={ <TabListWrapper /> }
			>
				{ children }
			</Ariakit.TabList>
		);
	}
);
