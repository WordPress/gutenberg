/**
 * WordPress dependencies
 */
import { forwardRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from './dashboard-context';
import { WidgetContextProvider } from './widget-context';
import { WidgetRender } from './widget-render';
import styles from './widget-dashboard.module.css';
import type { WidgetInstance } from './types';

export interface WidgetProps {
	widget: WidgetInstance< unknown >;
	index: number;
}

/**
 * Per-instance wrapper. Currently a minimal slot that provides widget
 * identity via context and hosts `WidgetRender`. Chrome (header, remove,
 * badges, error UI, loading overlay) is tracked separately and extends this
 * compound without changing the public signature.
 */
export const Widget = forwardRef< HTMLDivElement, WidgetProps >(
	function Widget( { widget, index }, ref ) {
		const { widgetTypes } = useDashboardInternalContext();
		const widgetType = widgetTypes.find( ( t ) => t.name === widget.type );

		const contextValue = useMemo(
			() => ( {
				uuid: widget.uuid,
				name: widget.type,
				position: index,
			} ),
			[ widget.uuid, widget.type, index ]
		);

		if ( ! widgetType ) {
			return null;
		}

		return (
			<WidgetContextProvider value={ contextValue }>
				<div ref={ ref } className={ styles.widget }>
					<WidgetRender widget={ widget } widgetType={ widgetType } />
				</div>
			</WidgetContextProvider>
		);
	}
);
