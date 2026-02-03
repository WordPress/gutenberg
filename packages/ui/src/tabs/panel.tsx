import { forwardRef, useEffect } from '@wordpress/element';
import clsx from 'clsx';
import { Tabs as _Tabs } from '@base-ui/react/tabs';
import { useTabsValidationContext } from './context';
import styles from './style.module.css';
import type { TabPanelProps } from './types';

/**
 * A panel displayed when the corresponding tab is active.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Panel = forwardRef< HTMLDivElement, TabPanelProps >(
	function TabPanel( { className, value, ...otherProps }, forwardedRef ) {
		const validationContext = useTabsValidationContext();

		// Register this panel's value for validation
		useEffect( () => {
			if ( validationContext && value !== undefined ) {
				return validationContext.registerPanel( value );
			}
		}, [ validationContext, value ] );

		return (
			<_Tabs.Panel
				ref={ forwardedRef }
				className={ clsx( styles.tabpanel, className ) }
				value={ value }
				{ ...otherProps }
			/>
		);
	}
);
