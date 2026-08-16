import type { ComponentType } from 'react';
import { createAdminBlock } from './create-admin-block';
import type { AdminBlockComponentProps, AdminBlockSpec } from './types';

interface AdminBlockEntry {
	spec: AdminBlockSpec;
	component: ComponentType< AdminBlockComponentProps >;
}

/*
 * Module-level registry: block name -> spec and its factory-built component.
 * Hand-populated by the bundled admin blocks today; a future `admin.tsx`
 * discovery convention in the build pipeline would populate it the way
 * `viewScript` is discovered.
 */
const registry = new Map< string, AdminBlockEntry >();

/*
 * Registers the admin (runtime React) representation of a block from its
 * declarative spec. The factory builds the component once, here.
 */
export function registerAdminBlock( spec: AdminBlockSpec ): void {
	registry.set( spec.name, { spec, component: createAdminBlock( spec ) } );
}

/*
 * Returns the registry entry for a block name, or undefined when the block has
 * no admin representation and must fall back to the server render.
 */
export function getAdminBlock( name: string ): AdminBlockEntry | undefined {
	return registry.get( name );
}
