import { useMemo } from '@wordpress/element';
import { getLazyWidgetComponent } from '../../tools/get-lazy-widget-component';
import { WidgetActionsCollector } from '../../widget-host/widget-actions-collector';
import { WidgetIdentityProvider } from '../../widget-identity/widget-identity';
import type { WidgetIdentity } from '../../widget-identity';
import type { ResolveWidgetModule, WidgetType } from '../../types';

interface WidgetRenderProps< Item = unknown > {
	widgetType: WidgetType< Item >;
	attributes?: Item;
	setAttributes?: ( next: Partial< Item > ) => void;
	resolveWidgetModule: ResolveWidgetModule;
}

/*
 * Resolves a widget type's `renderModule` via `resolveWidgetModule` and
 * mounts the resulting component with the `attributes`/`setAttributes`
 * render contract. Lends the subtree the type's identity
 * (`useWidgetIdentity`) from the `widgetType` already in hand.
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

	const identity = useMemo< WidgetIdentity >(
		() => ( { title: widgetType.title } ),
		[ widgetType.title ]
	);

	return (
		<WidgetIdentityProvider value={ identity }>
			<WidgetActionsCollector>
				{ /* Cached `lazy()` keyed by renderModule; identity is stable across renders. */ }
				{ /* eslint-disable-next-line react-hooks/static-components */ }
				<WidgetComponent
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</WidgetActionsCollector>
		</WidgetIdentityProvider>
	);
}
