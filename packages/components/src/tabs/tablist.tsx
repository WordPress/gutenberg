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
import type { WordPressComponentProps } from '../context';

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const context = useTabsContext();
	if ( ! context ) {
		warning(
			'`Tabs.TabList` needs to receive context from a `Tabs` component or a `Tabs.Context.Provider`.'
		);
		return null;
	}
	const { store } = context;
	return (
		<Ariakit.TabList
			ref={ ref }
			store={ store }
			render={ <TabListWrapper /> }
			{ ...otherProps }
		>
			{ children }
		</Ariakit.TabList>
	);
} );
