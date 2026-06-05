/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { getLazyWidgetComponent } from '../../tools/get-lazy-widget-component';
import type { ResolveWidgetModule, WidgetType } from '../../types';

interface WidgetRenderProps< Item = unknown > {
	widgetType: WidgetType< Item >;
	attributes?: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
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
