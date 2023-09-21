/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import type { TabListProps } from './types';
import { useTabsContext } from './context';
import { TabListWrapper } from './styles';

function TabList( { children, className, style }: TabListProps ) {
	const context = useTabsContext();
	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store } = context;
	return (
		<Ariakit.TabList
			style={ style }
			store={ store }
			className={ className }
			render={ <TabListWrapper /> }
		>
			{ children }
		</Ariakit.TabList>
	);
}

export default TabList;
