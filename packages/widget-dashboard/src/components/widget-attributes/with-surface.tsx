import type { ComponentType } from 'react';
import type { DataFormControlProps, Field } from '@wordpress/dataviews';
import type { WidgetAttributeValues } from '../../types';

/**
 * Where the header renders a high-relevance field's `Edit` control: inline
 * in the widget header, or in the "Widget controls" popover once the
 * inline controls collapse.
 */
export type WidgetAttributeSurface = 'header' | 'dropdown';

type EditComponent = ComponentType<
	DataFormControlProps< WidgetAttributeValues >
>;

/**
 * Props an in-process widget type's component `Edit` receives in the
 * header. `surface` is absent everywhere else (the settings modal, for one).
 */
type SurfaceEditProps = DataFormControlProps< WidgetAttributeValues > & {
	surface: WidgetAttributeSurface;
};

// One wrapper per component and surface, so the control keeps its identity
// (and its state) across renders.
const cache: Record<
	WidgetAttributeSurface,
	WeakMap< EditComponent, EditComponent >
> = {
	header: new WeakMap(),
	dropdown: new WeakMap(),
};

function wrapEdit(
	Edit: EditComponent,
	surface: WidgetAttributeSurface
): EditComponent {
	let wrapped = cache[ surface ].get( Edit );
	if ( ! wrapped ) {
		const Control = Edit as ComponentType< SurfaceEditProps >;
		wrapped = function SurfaceEdit( props ) {
			return <Control { ...props } surface={ surface } />;
		};
		cache[ surface ].set( Edit, wrapped );
	}
	return wrapped;
}

/**
 * Tells each field's `Edit` control which surface renders it.
 *
 * Only a component `Edit` can read the prop, and only an in-process widget
 * type can declare one: on the wire, `Edit` is a control name or config.
 * Built-in controls take no such prop, so fields that name one are
 * returned as they are.
 *
 * @param fields  The high-relevance fields.
 * @param surface Where they render.
 */
export function withSurface(
	fields: Field< WidgetAttributeValues >[],
	surface: WidgetAttributeSurface
): Field< WidgetAttributeValues >[] {
	return fields.map( ( field ) =>
		typeof field.Edit === 'function'
			? { ...field, Edit: wrapEdit( field.Edit, surface ) }
			: field
	);
}
