import { h as createElement, type VNode } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import {
	directive,
	isDefaultDirectiveSuffix,
	getEvaluate,
	type DirectiveEntry,
} from '../hooks';
import { warn, kebabToCamelCase } from '../utils';
import { getScope } from '../scopes';
import { proxifyContext, proxifyState } from '../proxies';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';

/**
 * Obtains the given item key based on the passed `eachKey` entry. Used by the
 * `wp-each` directive.
 *
 * The item key is computed using `getEvaluate` with a mocked scope simulating
 * the specific context that inner directives will inherit, i.e., including the
 * item under the corresponding item prop.
 *
 * @param inheritedValue Inherited context value.
 * @param namespace      Namespace for the `wp-each` directive.
 * @param item           Item from the list of items pointed by `wp-each`.
 * @param itemProp       Prop in which the item is accessible from the context.
 * @param eachKey        Directive entry pointing to the item's key.
 * @return The evaluated key for the passed item.
 */
const evaluateItemKey = (
	inheritedValue: any,
	namespace: string,
	item: unknown,
	itemProp: string,
	eachKey?: DirectiveEntry
) => {
	// Construct a client context with the item. Note that accessing the item
	// prop is not reactive, as this simulated context is not proxified.
	const clientContextWithItem = {
		...inheritedValue.client,
		[ namespace ]: {
			...inheritedValue.client[ namespace ],
			[ itemProp ]: item,
		},
	};

	// Scope must contain the client and the server contexts.
	const scope = {
		...getScope(),
		context: clientContextWithItem,
		serverContext: inheritedValue.server,
	};

	// If passed, evaluate `eachKey` entry with the simulated scope. Return
	// `item` otherwise.
	return eachKey ? getEvaluate( { scope } )( eachKey ) : item;
};

/**
 * Generates an `Iterable` from the passed items that returns, for each item, a
 * tuple with the item, its context and its evaluated key. Used by the `wp-each`
 * directive.
 *
 * @param inheritedValue Inherited context value.
 * @param namespace      Namespace for the `wp-each` directive.
 * @param items          List of items pointed by `wp-each`.
 * @param itemProp       Prop in which items are accessible from the context.
 * @param eachKey        Directive entry pointing to the item's key.
 * @return Generator that yields items along with their context and key.
 */
const useItemContexts = function* (
	inheritedValue: any,
	namespace: string,
	items: Iterable< unknown >,
	itemProp: string,
	eachKey?: DirectiveEntry
): Generator< [ item: unknown, context: any, key: any ] > {
	const { current: itemContexts } = useRef< Map< any, any > >( new Map() );

	for ( const item of items ) {
		const key = evaluateItemKey(
			inheritedValue,
			namespace,
			item,
			itemProp,
			eachKey
		);

		if ( ! itemContexts.has( key ) ) {
			itemContexts.set(
				key,
				proxifyContext(
					proxifyState( namespace, {
						// Inits the item prop in the context to shadow it in case
						// it was inherited from the parent context. The actual
						// value is set in the `wp-each` directive later on.
						[ itemProp ]: undefined,
					} ),
					inheritedValue.client[ namespace ]
				)
			);
		}
		yield [ item, itemContexts.get( key ), key ];
	}
};

// data-wp-each--[item]
directive(
	'each',
	( {
		directives: { each, 'each-key': eachKey },
		context: inheritedContext,
		element,
		evaluate,
	} ) => {
		if ( element.type !== 'template' ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					'The data-wp-each directive can only be used on <template> elements.'
				);
			}
			return;
		}

		const { Provider } = inheritedContext;
		const inheritedValue = useContext( inheritedContext );

		const [ entry ] = each;
		const { namespace, suffix, uniqueId } = entry;

		if ( each.length > 1 ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					'The usage of multiple data-wp-each directives on the same element is not supported. Please pick only one.'
				);
			}
			return;
		}

		if ( uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'each', uniqueId );
			}
			return;
		}

		let iterable = evaluate( entry );
		if ( iterable === PENDING_GETTER ) {
			return;
		}
		if ( typeof iterable === 'function' ) {
			iterable = iterable();
		}

		if ( typeof iterable?.[ Symbol.iterator ] !== 'function' ) {
			return;
		}

		const itemProp = suffix ? kebabToCamelCase( suffix ) : 'item';

		const result: VNode< any >[] = [];

		const itemContexts = useItemContexts(
			inheritedValue,
			namespace,
			iterable,
			itemProp,
			eachKey?.[ 0 ]
		);

		for ( const [ item, itemContext, key ] of itemContexts ) {
			const mergedContext = {
				client: {
					...inheritedValue.client,
					[ namespace ]: itemContext,
				},
				server: { ...inheritedValue.server },
			};

			// Sets the item after proxifying the context.
			mergedContext.client[ namespace ][ itemProp ] = item;

			result.push(
				createElement(
					Provider,
					{ value: mergedContext, key },
					element.props.content
				)
			);
		}
		return result;
	},
	{ priority: 20 }
);

// data-wp-each-child (internal use only)
directive(
	'each-child',
	( { directives: { 'each-child': eachChild }, element, evaluate } ) => {
		const entry = eachChild.find( isDefaultDirectiveSuffix );

		if ( ! entry ) {
			return;
		}

		const iterable = evaluate( entry );
		return iterable === PENDING_GETTER ? element : null;
	},
	{ priority: 1 }
);
