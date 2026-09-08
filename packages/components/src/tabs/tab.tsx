import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import { chevronRight } from '@wordpress/icons';
import type { TabProps } from './types';
import { useTabsContext } from './context';
import {
	Tab as StyledTab,
	TabChildren as StyledTabChildren,
	TabChevron as StyledTabChevron,
} from './styles';
import type { WordPressComponentProps } from '../context';

export const Tab = forwardRef<
	HTMLButtonElement,
	Omit< WordPressComponentProps< TabProps, 'button', false >, 'id' >
>( function Tab( { children, tabId, disabled, render, ...otherProps }, ref ) {
	const { store, instanceId } = useTabsContext() ?? {};

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
			{ ...otherProps }
		>
			<StyledTabChildren>{ children }</StyledTabChildren>
			<StyledTabChevron icon={ chevronRight } />
		</StyledTab>
	);
} );
