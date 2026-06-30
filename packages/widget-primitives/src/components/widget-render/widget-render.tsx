/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { getLazyWidgetComponent } from '../../tools/get-lazy-widget-component';
import type {
	ResolveWidgetModule,
	WidgetRenderProps as WidgetRenderComponentProps,
	WidgetType,
} from '../../types';

interface WidgetRenderProps< Item = unknown > {
	widgetType: WidgetType< Item >;
	attributes?: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
	titleId?: string;
	resolveWidgetModule: ResolveWidgetModule;
}

/*
 * Resolves a widget type's `renderModule` via `resolveWidgetModule` and
 * mounts the resulting component with the `attributes`/`setAttributes`
 * render contract.
 */
export function WidgetRender< Item = unknown >( {
	widgetType,
	attributes,
	setAttributes,
	titleId,
	resolveWidgetModule,
}: WidgetRenderProps< Item > ) {
	const WidgetComponent = getLazyWidgetComponent(
		widgetType.renderModule,
		resolveWidgetModule
	);

	const componentProps: WidgetRenderComponentProps< Item > = {
		attributes: attributes as Item,
		setAttributes,
		...( widgetType.hasOwnHeading ? { titleId } : {} ),
	};

	return (
		<>
			{ /* Cached `lazy()` keyed by renderModule; identity is stable across renders. */ }
			{ /* eslint-disable-next-line react-hooks/static-components */ }
			<WidgetComponent { ...componentProps } />
		</>
	);
}
