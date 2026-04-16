/**
 * External dependencies
 */
import type { ComponentType, ReactElement } from 'react';

/**
 * Internal dependencies
 */
import type { ViewBaseProps } from '../../types';

export interface LayoutDefinition< Item = any > {
	type: string;
	label: string;
	component: ComponentType< ViewBaseProps< Item > >;
	icon?: ReactElement;
}

// Kept in sync with the `type` values in dataviews-layouts/index.ts. Inlined
// (rather than imported from ../constants) because constants.ts pulls in
// @wordpress/icons, which requires a build step before it can resolve in
// Jest. The six type names change rarely and will break both call sites
// noisily if they drift.
const BUILT_IN_LAYOUT_TYPES: readonly string[] = [
	'table',
	'grid',
	'list',
	'activity',
	'pickerGrid',
	'pickerTable',
];

const registry = new Map< string, LayoutDefinition >();

export function registerLayout( layout: LayoutDefinition ): void {
	if ( BUILT_IN_LAYOUT_TYPES.includes( layout.type ) ) {
		throw new Error(
			`registerLayout: "${ layout.type }" is a built-in DataViews layout type.`
		);
	}
	if ( registry.has( layout.type ) ) {
		throw new Error(
			`registerLayout: "${ layout.type }" is already registered.`
		);
	}
	registry.set( layout.type, layout );
}

export function getRegisteredLayout(
	type: string
): LayoutDefinition | undefined {
	return registry.get( type );
}

export function getRegisteredLayouts(): LayoutDefinition[] {
	return Array.from( registry.values() );
}

/**
 * Internal test helper. Not exported from the package.
 */
export function __clearRegisteredLayouts(): void {
	registry.clear();
}
