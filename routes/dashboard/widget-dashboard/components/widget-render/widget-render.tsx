/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetRender } from '../../../widget-primitives';
import type { DashboardWidget } from '../../types';
import type { WidgetType } from '../../../widget-primitives';

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
