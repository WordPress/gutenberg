/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * A single curated attribute on an admin block: the subset of a wrapped
 * component's prop surface that a composition is allowed to set.
 */
export interface AdminBlockAttribute {
	/*
	 * Declarative value type, consumed by the future editor face (DataForm).
	 * Not enforced at runtime, where the parsed block attribute is used as-is.
	 */
	type?: 'string' | 'boolean' | 'number';

	/* Allowed values when the attribute is an enumeration. Declarative. */
	enum?: readonly string[];

	/* Value applied when the composition omits the attribute. */
	default?: unknown;

	/* Component prop this attribute feeds. Defaults to the attribute name. */
	prop?: string;
}

/**
 * Declarative description of an admin block: the wrapped runtime component plus
 * the curated subset of its surface (attributes, container support).
 *
 * Shaped so the editor face (block type registration) can later be derived from
 * the same declaration; only the runtime fields are consumed here. Later steps
 * extend the spec with events, context, and read-bindings.
 */
export interface AdminBlockSpec {
	/* Block name, e.g. `core-admin/stack`. */
	name: string;

	/*
	 * The wrapped runtime component. Stored behind a generic signature because
	 * the factory maps a dynamic, string-keyed attribute set onto a statically
	 * prop-typed component.
	 */
	component: ComponentType< any >;

	/* Curated attribute -> prop map. NOT the component's full prop surface. */
	attributes: Record< string, AdminBlockAttribute >;

	/* When true, the component receives the rendered inner blocks as children. */
	supportsInnerBlocks?: boolean;
}

/**
 * Props the renderer passes to every admin block component produced by the
 * factory.
 */
export interface AdminBlockComponentProps {
	/* The block's parsed attributes. */
	attributes: Record< string, unknown >;

	/*
	 * Rendered inner blocks, present only for container blocks
	 * (`supportsInnerBlocks`).
	 */
	children?: ReactNode;
}
