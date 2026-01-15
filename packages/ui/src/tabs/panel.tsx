/**
 * External dependencies
 */
import { forwardRef } from 'react';
import clsx from 'clsx';
import { Tabs as BaseUITabs } from '@base-ui/react/tabs';

/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TabPanelProps } from './types';

/**
 * A panel displayed when the corresponding tab is active.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Panel = forwardRef< HTMLDivElement, TabPanelProps >(
	function TabPanel(
		{ className, focusable = true, tabIndex, ...otherProps },
		forwardedRef
	) {
		return (
			<BaseUITabs.Panel
				ref={ forwardedRef }
				tabIndex={ tabIndex ?? ( focusable ? 0 : -1 ) }
				className={ clsx( styles.tabpanel, className ) }
				{ ...otherProps }
			/>
		);
	}
);
