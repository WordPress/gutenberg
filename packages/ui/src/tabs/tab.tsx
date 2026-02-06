import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Tabs as _Tabs } from '@base-ui/react/tabs';
import { chevronRight } from '@wordpress/icons';
import { Icon } from '../icon';
import styles from './style.module.css';
import type { TabProps } from './types';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Tab = forwardRef< HTMLButtonElement, TabProps >( function Tab(
	{ className, children, ...otherProps },
	forwardedRef
) {
	return (
		<_Tabs.Tab
			ref={ forwardedRef }
			className={ clsx( styles.tab, className ) }
			{ ...otherProps }
		>
			<span className={ styles[ 'tab-children' ] }>{ children }</span>
			<Icon icon={ chevronRight } className={ styles[ 'tab-chevron' ] } />
		</_Tabs.Tab>
	);
} );
