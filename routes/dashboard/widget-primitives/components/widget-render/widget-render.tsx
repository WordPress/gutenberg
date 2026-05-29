/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { getLazyWidgetComponent } from '../../tools/get-lazy-widget-component';
import type { ResolveWidgetModule, WidgetType } from '../../types';

interface WidgetRenderProps< Item = unknown > {
	/**
	 * The widget type to render.
	 */
	widgetType: WidgetType< Item >;

	/**
	 * Attributes the widget renders with.
	 */
	attributes?: Item;

	/**
	 * Callback to update the widget's attributes.
	 */
	setAttributes?: ( next: Partial< Item > ) => void;

	/*
	 * Host-provided resolver for the `renderModule` script. Required
	 * because `getLazyWidgetComponent` does not default it; hosts that
	 * want the standard dynamic-import behavior can pass it directly.
	 */
	resolveWidgetModule: ResolveWidgetModule;
}

/*
 * Host-agnostic render entry point for any widget type. Resolves the
 * widget's `renderModule` through the host-provided
 * `resolveWidgetModule` and mounts the resulting component with the
 * standard `attributes` plus `setAttributes` render contract.
 */
export function WidgetRender< Item = unknown >( {
	widgetType,
	attributes,
	setAttributes,
	resolveWidgetModule,
}: WidgetRenderProps< Item > ) {
	const WidgetComponent = getLazyWidgetComponent(
		widgetType.renderModule,
		resolveWidgetModule
	);

	return (
		<>
			{ /* WidgetComponent is a cached `lazy()` keyed by renderModule, so its identity stays stable across renders. */ }
			{ /* eslint-disable-next-line react-hooks/static-components */ }
			<WidgetComponent
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
}
