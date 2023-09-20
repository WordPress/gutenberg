/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import type { TabListProps } from './types';
import { useTabsContext } from './context';

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
			className={ classnames( 'components-tabs__tabs', className ) }
		>
			{ children }
		</Ariakit.TabList>
	);
}

export default TabList;
