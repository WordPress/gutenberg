import { createContext, useContext } from '@wordpress/element';
import type { ReactNode } from 'react';

/**
 * Identity of the widget type a render mounts under: the translated
 * fields of the type that the body may need, without the rest of the
 * host-facing `WidgetType` bag (schema, presentation, chrome).
 *
 * Every field is optional. Absent identity (no provider, or a host that
 * mounts the render module without `WidgetRender`) degrades to `{}`;
 * the widget names its content itself.
 */
export interface WidgetIdentity {
	/**
	 * Translated title of the widget type, as the host already shows it.
	 */
	title?: string;
}

const WidgetIdentityContext = createContext< WidgetIdentity >( {} );

type WidgetIdentityProviderProps = {
	value: WidgetIdentity;
	children: ReactNode;
};

/**
 * Provides widget-type identity to the render below it. Mounted by
 * `WidgetRender` from the `widgetType` it already holds; not part of the
 * public package surface.
 *
 * @param {WidgetIdentityProviderProps} props Component props.
 */
export function WidgetIdentityProvider( {
	value,
	children,
}: WidgetIdentityProviderProps ): React.ReactNode {
	return (
		<WidgetIdentityContext.Provider value={ value }>
			{ children }
		</WidgetIdentityContext.Provider>
	);
}

/**
 * Reads the identity of the widget type this render belongs to. Defaults
 * to `{}` when no provider is above: consumers guard each field.
 */
export function useWidgetIdentity(): WidgetIdentity {
	return useContext( WidgetIdentityContext );
}
