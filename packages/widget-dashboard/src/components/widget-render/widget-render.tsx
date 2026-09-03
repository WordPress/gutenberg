import { useCallback } from '@wordpress/element';
import { WidgetRender as WidgetRenderPrimitive } from '@wordpress/widget-primitives';
import type { WidgetType } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { DashboardWidget } from '../../types';

interface WidgetRenderProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
}

/**
 * Adapter around the host-agnostic `WidgetRender` primitive. Bridges the
 * dashboard context (`resolveWidgetModule`, layout state) and turns
 * layout-level attribute updates into the per-instance `setAttributes`
 * callback the render contract expects. When the policy denies `edit`,
 * the widget renders read-only: it receives no `setAttributes`.
 *
 * @param {WidgetRenderProps} props Component props.
 */
export function WidgetRender( { widget, widgetType }: WidgetRenderProps ) {
	const { layout, onLayoutChange, resolveWidgetModule, canPerform } =
		useDashboardInternalContext();
	const canEdit = canPerform( { operation: 'edit', widget, widgetType } );

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
		<WidgetRenderPrimitive
			widgetType={ widgetType }
			attributes={ widget.attributes }
			setAttributes={ canEdit ? setAttributes : undefined }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}
