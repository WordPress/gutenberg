/**
 * WordPress dependencies
 */

import { useContext, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TabProps } from './types';
import warning from '@wordpress/warning';
import { TabsContext } from './context';
import { Tab as StyledTab } from './styles';
import type { WordPressComponentProps } from '../context';

export const Tab = forwardRef<
	HTMLButtonElement,
	WordPressComponentProps< TabProps, 'button', false >
>( function Tab( { children, id, disabled, render, ...otherProps }, ref ) {
	const context = useContext( TabsContext );
	if ( ! context ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;
	const instancedTabId = `${ instanceId }-${ id }`;
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
		</StyledTab>
	);
} );
