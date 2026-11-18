import { useStoreState, TabPanel as AriakitTabPanel } from '@ariakit/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import type { TabPanelProps } from './types';
import styles from './style.module.scss';
import { useTabsContext } from './context';
import type { WordPressComponentProps } from '../context';

export const TabPanel = forwardRef<
	HTMLDivElement,
	Omit< WordPressComponentProps< TabPanelProps, 'div', false >, 'id' >
>( function UnforwardedTabPanel(
	{ children, tabId, focusable = true, className, ...otherProps },
	ref
) {
	const context = useTabsContext();
	const selectedId = useStoreState( context?.store, 'selectedId' );
	if ( ! context ) {
		warning( '`Tabs.TabPanel` must be wrapped in a `Tabs` component.' );
		return null;
	}
	const { store, instanceId } = context;
	const instancedTabId = `${ instanceId }-${ tabId }`;

	return (
		<AriakitTabPanel
			ref={ ref }
			store={ store }
			// For TabPanel, the id passed here is the id attribute of the DOM
			// element.
			// `tabId` is the id of the tab that controls this panel.
			id={ `${ instancedTabId }-view` }
			tabId={ instancedTabId }
			focusable={ focusable }
			{ ...otherProps }
			className={ clsx( styles[ 'tab-panel' ], className ) }
		>
			{ selectedId === instancedTabId && children }
		</AriakitTabPanel>
	);
} );
