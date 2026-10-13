import clsx from 'clsx';
import { Tab as AriakitTab } from '@ariakit/react';
import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import { chevronRight } from '@wordpress/icons';
import type { TabProps } from './types';
import { useTabsContext } from './context';
import Icon from '../icon';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';

export const Tab = forwardRef<
	HTMLButtonElement,
	Omit< WordPressComponentProps< TabProps, 'button', false >, 'id' >
>( function UnforwardedTab(
	{ children, tabId, disabled, render, className, ...otherProps },
	ref
) {
	const { store, instanceId } = useTabsContext() ?? {};

	if ( ! store ) {
		warning( '`Tabs.Tab` must be wrapped in a `Tabs` component.' );
		return null;
	}

	const instancedTabId = `${ instanceId }-${ tabId }`;

	return (
		<AriakitTab
			ref={ ref }
			store={ store }
			id={ instancedTabId }
			disabled={ disabled }
			render={ render }
			{ ...otherProps }
			className={ clsx( styles.tab, className ) }
		>
			<span className={ styles[ 'tab-children' ] }>{ children }</span>
			<Icon className={ styles[ 'tab-chevron' ] } icon={ chevronRight } />
		</AriakitTab>
	);
} );
