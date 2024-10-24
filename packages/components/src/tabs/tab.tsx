/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */

import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabProps } from './types';
import warning from '@wordpress/warning';
import { useTabsContext } from './context';
import {
	Tab as StyledTab,
	TabChildren as StyledTabChildren,
	TabChevron as StyledTabChevron,
} from './styles';
import type { WordPressComponentProps } from '../context';
import { chevronRight } from '@wordpress/icons';

export const Tab = forwardRef<
	HTMLButtonElement,
	Omit< WordPressComponentProps< TabProps, 'button', false >, 'id' >
>( function Tab( { children, tabId, disabled, render, ...otherProps }, ref ) {
	const { store, instanceId } = useTabsContext() ?? {};

	// If the active item is not connected, the tablist may end up in a state
	// where none of the tabs are tabbable. In this case, we force all tabs to
	// be tabbable, so that as soon as an item received focus, it becomes active
	// and Tablist goes back to working as expected.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const tabbable = Ariakit.useStoreState( store, ( state ) => {
		return (
			state?.activeId !== null &&
			! store?.item( state?.activeId )?.element?.isConnected
		);
	} );

	if ( ! store ) {
		warning( '`Tabs.Tab` must be wrapped in a `Tabs` component.' );
		return null;
	}

	const instancedTabId = `${ instanceId }-${ tabId }`;

	return (
		<StyledTab
			ref={ ref }
			store={ store }
			id={ instancedTabId }
			disabled={ disabled }
			render={ render }
			tabbable={ tabbable }
			{ ...otherProps }
		>
			<StyledTabChildren>{ children }</StyledTabChildren>
			<StyledTabChevron icon={ chevronRight } />
		</StyledTab>
	);
} );
