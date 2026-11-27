import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Tabs as _Tabs } from '@base-ui/react/tabs';
import { useRegisterTab } from './context';
import styles from './style.module.scss';
import type { TabProps } from './types';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const Tab = forwardRef< HTMLButtonElement, TabProps >(
	function UnforwardedTab(
		{ className, children, ...otherProps },
		forwardedRef
	) {
		useRegisterTab();

		return (
			<_Tabs.Tab
				ref={ forwardedRef }
				className={ clsx( styles.tab, className ) }
				{ ...otherProps }
			>
				<span className={ styles[ 'tab-children' ] }>
					{ children }
					{ /* Keep the SVG out of the layout before the tab styles load. */ }
					<svg
						aria-hidden="true"
						focusable="false"
						width="0"
						height="0"
						className={ styles[ 'focus-ring' ] }
					>
						<rect />
					</svg>
				</span>
			</_Tabs.Tab>
		);
	}
);
