/**
 * External dependencies
 */
import type { VNode, Context, RefObject, h as createElement } from 'preact';

interface DirectiveEntry {
	value: string | Object;
	namespace: string;
	suffix: string;
}

interface Scope {
	evaluate: Evaluate;
	context: Context< any >;
	ref: RefObject< HTMLElement >;
	attributes: createElement.JSX.HTMLAttributes;
}

interface Evaluate {
	( entry: DirectiveEntry, ...args: any[] ): any;
}

type DirectiveEntries = Record< string, DirectiveEntry[] >;

interface DirectiveArgs {
	/**
	 * Object map with the defined directives of the element being evaluated.
	 */
	directives: DirectiveEntries;
	/**
	 * Props present in the current element.
	 */
	props: Object;
	/**
	 * Virtual node representing the element.
	 */
	element: VNode;
	/**
	 * The inherited context.
	 */
	context: Context< any >;
	/**
	 * Function that resolves a given path to a value either in the store or the
	 * context.
	 */
	evaluate: Evaluate;
}

interface DirectiveCallback {
	( args: DirectiveArgs ): VNode | void;
}

interface DirectiveOptions {
	/**
	 * Value that specifies the priority to evaluate directives of this type.
	 * Lower numbers correspond with earlier execution.
	 *
	 * @default 10
	 */
	priority?: number;
}

interface DirectivesProps {
	directives: DirectiveEntries;
	priorityLevels: PriorityLevel[];
	element: VNode;
	originalProps: any;
	previousScope?: Scope;
}

interface GetEvaluate {
	( args: { scope: Scope } ): Evaluate;
}

type PriorityLevel = string[];

interface GetPriorityLevels {
	( directives: DirectiveEntries ): PriorityLevel[];
}

type EffectFunction = {
	c: () => void;
	x: () => void;
};

interface StoreOptions {
	/**
	 * Property to block/unblock private store namespaces.
	 *
	 * If the passed value is `true`, it blocks the given namespace, making it
	 * accessible only trough the returned variables of the `store()` call. In
	 * the case a lock string is passed, it also blocks the namespace, but can
	 * be unblocked for other `store()` calls using the same lock string.
	 *
	 * @example
	 * ```
	 * // The store can only be accessed where the `state` const can.
	 * const { state } = store( 'myblock/private', { ... }, { lock: true } );
	 * ```
	 *
	 * @example
	 * ```
	 * // Other modules knowing `SECRET_LOCK_STRING` can access the namespace.
	 * const { state } = store(
	 *   'myblock/private',
	 *   { ... },
	 *   { lock: 'SECRET_LOCK_STRING' }
	 * );
	 * ```
	 */
	lock?: boolean | string;
}
