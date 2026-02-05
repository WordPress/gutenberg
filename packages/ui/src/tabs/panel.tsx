import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Tabs as _Tabs } from '@base-ui/react/tabs';
import styles from './style.module.css';
import type { TabPanelProps } from './types';

/**
 * A panel displayed when the corresponding tab is active.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Panel = forwardRef< HTMLDivElement, TabPanelProps >(
	function TabPanel( { className, ...otherProps }, forwardedRef ) {
		return (
			<_Tabs.Panel
				ref={ forwardedRef }
				className={ clsx( styles.tabpanel, className ) }
				{ ...otherProps }
			/>
		);
	}
);
