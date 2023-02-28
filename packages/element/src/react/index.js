/**
 * Object containing a React element.
 *
 * @typedef {import('react').ReactElement} WPElement
 */

/**
 * Object containing a React component.
 *
 * @typedef {import('react').ComponentType} WPComponent
 */

/**
 * Object containing a React synthetic event.
 *
 * @typedef {import('react').SyntheticEvent} WPSyntheticEvent
 */

export { concatChildren } from './concat-children';
export * from './core';
export { createElement } from './create-element';
export { switchChildrenNodeName } from './switch-children-node-name';
