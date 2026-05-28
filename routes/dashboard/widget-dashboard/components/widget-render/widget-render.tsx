/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { getLazyWidgetComponent } from '../../../widget-primitives';
import type { DashboardWidget } from '../../types';
import type { WidgetType } from '../../../widget-primitives';

interface WidgetRenderInternalProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
}

function WidgetRenderImpl( { widget, widgetType }: WidgetRenderInternalProps ) {
	const { layout, onLayoutChange, resolveWidgetModule } =
		useDashboardInternalContext();

	const WidgetComponent = getLazyWidgetComponent(
		widgetType.renderModule,
		resolveWidgetModule
	);

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
		<>
			{ /* WidgetComponent is a cached `lazy()` keyed by renderModule, so its identity stays stable across renders. */ }
			{ /* eslint-disable-next-line react-hooks/static-components */ }
			<WidgetComponent
				attributes={ widget.attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

/**
 * Resolves a widget's render module via the configured resolver and renders
 * it with the minimal `WidgetRenderProps` contract: `attributes` plus
 * `setAttributes`. Suspense and error handling live one layer up in the
 * `WidgetDashboard.Widget` chrome, so a failing or pending body does not tear
 * down the surrounding header or controls.
 *
 * Kept internal to the package. Surfaces that want bare widget rendering
 * should compose `WidgetDashboard.Widget` instead.
 */
export const WidgetRender = WidgetRenderImpl;
