import { CONNECTED_NAMESPACE, COMPONENT_NAMESPACE } from './constants';

/**
 * Creates a dedicated context namespace HTML attribute for components.
 * ns is short for "namespace"
 *
 * @example
 * ```jsx
 * <div {...ns('Container')} />
 * ```
 *
 * @param componentName The name for the component.
 * @return A props object with the namespaced HTML attribute.
 */
export function getNamespace(
	componentName: string
): Record< string, unknown > {
	return { [ COMPONENT_NAMESPACE ]: componentName };
}

/**
 * Creates a dedicated connected context namespace HTML attribute for components.
 * ns is short for "namespace"
 *
 * @example
 * ```jsx
 * <div {...cns()} />
 * ```
 *
 * @return A props object with the namespaced HTML attribute.
 */
export function getConnectedNamespace(): Record< string, unknown > {
	return { [ CONNECTED_NAMESPACE ]: true };
}
