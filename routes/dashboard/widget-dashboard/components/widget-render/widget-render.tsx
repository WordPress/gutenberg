/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { WidgetRender } from '@wordpress/widget-primitives';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { DashboardWidget } from '../../types';

interface DashboardWidgetRenderProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
}

/*
 * Dashboard-specific adapter around the host-agnostic `WidgetRender`
 * primitive. Bridges the dashboard context (`resolveWidgetModule`, layout
 * state) and turns layout-level attribute updates into the per-instance
 * `setAttributes` callback the render contract expects.
 */
export function DashboardWidgetRender( {
	widget,
	widgetType,
}: DashboardWidgetRenderProps ) {
	const { layout, onLayoutChange, resolveWidgetModule } =
		useDashboardInternalContext();

	const setAttributes = useCallback(
		( next: Partial< unknown > ) => {
			onLayoutChange(
				layout.map( ( w ) =>
					w.uuid === widget.uuid
						? {
								...w,
								attributes: {
									...( w.attributes as object ),
									...( next as object ),
								},
						  }
						: w
				)
			);
		},
		[ widget.uuid, layout, onLayoutChange ]
	);

	return (
		<WidgetRender
			widgetType={ widgetType }
			attributes={ widget.attributes }
			setAttributes={ setAttributes }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}
