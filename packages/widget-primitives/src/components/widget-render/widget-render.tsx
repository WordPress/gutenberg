import { AdminBlockRenderer } from '../admin-block-renderer';
import { getLazyWidgetComponent } from '../../tools/get-lazy-widget-component';
import type { ResolveWidgetModule, WidgetType } from '../../types';

interface WidgetRenderProps< Item = unknown > {
	widgetType: WidgetType< Item >;
	attributes?: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
	resolveWidgetModule: ResolveWidgetModule;
}

/*
 * Host-agnostic render entry point for any widget type, branching on
 * `widgetType.origin` so callers do not have to know which storage backs the
 * widget.
 *
 * Server-defined types (code-registered, cpt) render through
 * `AdminBlockRenderer`. Built-in types resolve `renderModule` via
 * `resolveWidgetModule` and mount the component with the
 * `attributes`/`setAttributes` render contract.
 */
export function WidgetRender< Item = unknown >( {
	widgetType,
	attributes,
	setAttributes,
	resolveWidgetModule,
}: WidgetRenderProps< Item > ) {
	if ( widgetType.origin && widgetType.origin !== 'built-in' ) {
		return (
			<AdminBlockRenderer
				content={ widgetType.content ?? '' }
				attributes={ ( attributes ?? {} ) as Record< string, unknown > }
			/>
		);
	}

	const WidgetComponent = getLazyWidgetComponent(
		widgetType.renderModule,
		resolveWidgetModule
	);

	return (
		<>
			{ /* Cached `lazy()` keyed by renderModule; identity is stable across renders. */ }
			{ /* eslint-disable-next-line react-hooks/static-components */ }
			<WidgetComponent
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
}
