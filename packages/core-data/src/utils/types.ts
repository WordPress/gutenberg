import type { ReactElement } from 'react';

/**
 * A reducer, which also handles the initializing `undefined` state.
 */
export type Reducer< S, A > = ( state: S | undefined, action: A ) => S;

/**
 * The thunk argument a forwarded resolver uses: only the resolver it forwards
 * to, called with the forwarded arguments.
 */
export interface ForwardedResolverArgs<
	Name extends string,
	Args extends Array< unknown >,
> {
	resolveSelect: Record< Name, ( ...args: Args ) => Promise< unknown > >;
}

/**
 * An entity resource to check a permission on.
 */
export interface PermissionResource {
	kind: string;
	name: string;
	id?: string | number;
}

/**
 * A default template type of the theme.
 */
export interface TemplateType {
	slug: string;
	title?: string;
	description?: string;
}

/**
 * A template part area of the theme.
 */
export interface TemplateArea {
	area: string;
	icon?: string;
}

/**
 * The template parameters of `getTemplateInfo`.
 */
export interface TemplateInfoParams {
	templateTypes: ReadonlyArray< TemplateType >;
	templateAreas?: ReadonlyArray< TemplateArea >;
	template: TemplateInfoTemplate | false;
}

/**
 * The template fields `getTemplateInfo` reads.
 */
export interface TemplateInfoTemplate {
	slug?: string;
	area?: string;
	title?: string | { rendered?: string };
	description?: string | { raw?: string };
}

/**
 * The title, description and icon of a template.
 */
export interface TemplateInfo {
	title?: string;
	description?: string;
	icon?: ReactElement;
}
