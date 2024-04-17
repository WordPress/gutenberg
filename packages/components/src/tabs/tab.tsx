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
import { Tab as StyledTab, TabIndicator } from './styles';
import type { WordPressComponentProps } from '../context';

export const Tab = forwardRef<
	HTMLButtonElement,
	Omit< WordPressComponentProps< TabProps, 'button', false >, 'id' >
>( function Tab( { children, tabId, disabled, render, ...otherProps }, ref ) {
	const context = useTabsContext();
	const activeId = context?.store.useState( 'activeId' );
	const orientation = context?.store.useState( 'orientation' );
	if ( ! context ) {
		warning( '`Tabs.Tab` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;
	const instancedTabId = `${ instanceId }-${ tabId }`;
	return (
		<StyledTab
			ref={ ref }
			store={ store }
			id={ instancedTabId }
			disabled={ disabled }
			render={ render }
			{ ...otherProps }
		>
			{ children }
			{ activeId === instancedTabId && (
				<TabIndicator
					layoutId={ instanceId }
					className={
						orientation === 'vertical' ? 'is-vertical' : ''
					}
				/>
			) }
		</StyledTab>
	);
} );
