export const COMPONENT_NAMESPACE = 'data-g2-component';

/* eslint-disable jsdoc/valid-types */
/**
 * Creates a dedicated context namespace HTML attribute for components.
 * ns is short for "namespace"
 *
 * @example
 * ```jsx
 * <div {...ns('Container')} />
 * ```
 *
 * @param {string} componentName The name for the component.
 * @return {{ [COMPONENT_NAMESPACE]: string }} A props object with the namespaced HTML attribute.
 */
export function ns( componentName ) {
	/* eslint-enable jsdoc/valid-types */
	return { [ COMPONENT_NAMESPACE ]: componentName };
}
