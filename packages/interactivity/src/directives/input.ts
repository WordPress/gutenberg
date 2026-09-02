/**
 * data-wp-input — Two-way input binding directive.
 *
 * Collapses `data-wp-bind--value` + `data-wp-on--input` into one attribute.
 * Reads the signal value from the store and writes it back on input events.
 *
 * Auto-detects element type for correct binding:
 *   - checkbox → binds `checked` property, fires on `change`
 *   - radio    → binds `checked` based on value match
 *   - range/number → preserves numeric type via unary `+`
 *   - file     → reads files as base64-encoded data URIs
 *   - select   → single value on `change`; `multiple` → array of values
 *   - text, textarea → binds `value`, fires on `input`
 *
 * Examples:
 * ```html
 * <input data-wp-input="state.name" />
 * <input type="checkbox" data-wp-input="state.isActive" />
 * <input type="number" data-wp-input="state.count" />
 * <textarea data-wp-input="state.description"></textarea>
 * <select data-wp-input="state.country">...</select>
 * ```
 */
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { useInit, useLayoutEffect, warn } from '../utils';
import { store } from '../store';
import { PENDING_GETTER, peek } from '../proxies/state';
import { getContext } from '../scopes';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BindDescriptor {
	prop: string;
	events: string[];
	fromSignal?: (
		signalValue: unknown,
		props: Record< string, unknown >
	) => unknown;
	/**
	 * Converts the element's current value to the appropriate type
	 * for the signal.  Receives the signal's typeof as `signalType`.
	 * Return `undefined` to signal "no change" (used by radio uncheck).
	 */
	toSignal: (
		el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		signalType: string
	) => unknown;
}

type SignalFile = {
	name: string;
	contents: string;
	mime: string;
};

type InputBindingElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement;

const dataURIRegex = /^data:(?<mime>[^;]+);base64,(?<contents>.*)$/;

/* ------------------------------------------------------------------ */
/*  Descriptor detection                                               */
/* ------------------------------------------------------------------ */

const detectDescriptor = (
	elementType: string | null,
	props: Record< string, unknown >
): BindDescriptor => {
	const type = props.type as string | undefined;

	if ( type === 'checkbox' ) {
		return {
			prop: 'checked',
			events: [ 'change' ],
			fromSignal: ( signalValue ) => Boolean( signalValue ),
			toSignal: ( el, signalType ) => {
				const input = el as HTMLInputElement;
				// Datastar parity: default value "on" → boolean;
				// custom values reflect the checked value or empty string.
				if ( input.value !== 'on' ) {
					if ( signalType === 'boolean' ) {
						return input.checked;
					}
					return input.checked ? input.value : '';
				}
				if ( signalType === 'string' ) {
					return input.checked ? input.value : '';
				}
				return input.checked;
			},
		};
	}

	if ( type === 'radio' ) {
		return {
			prop: 'checked',
			events: [ 'change' ],
			fromSignal: ( signalValue, currentProps ) => {
				const inputValue = currentProps.value;
				return signalValue === inputValue;
			},
			toSignal: ( el, signalType ) => {
				const input = el as HTMLInputElement;
				if ( ! input.checked ) {
					return undefined;
				}
				return signalType === 'number' ? +input.value : input.value;
			},
		};
	}

	if ( type === 'range' || type === 'number' ) {
		return {
			prop: 'value',
			events: [ 'input' ],
			toSignal: ( el ) => +( el as HTMLInputElement ).value,
		};
	}

	if ( elementType === 'select' ) {
		return {
			prop: 'value',
			events: [ 'change' ],
			toSignal: ( el ) => {
				const select = el as HTMLSelectElement;
				if ( select.multiple ) {
					return Array.from(
						select.selectedOptions,
						( option ) => option.value
					);
				}
				return select.value;
			},
		};
	}

	// Custom elements (web components with a dash in the tag name).
	if ( elementType && elementType.includes( '-' ) ) {
		return {
			prop: 'value',
			events: [ 'input', 'change' ],
			toSignal: ( el, signalType ) =>
				signalType === 'number'
					? +( el as HTMLInputElement ).value
					: ( el as any ).value,
		};
	}

	// Textarea — explicit branch for readability.
	if ( elementType === 'textarea' ) {
		return {
			prop: 'value',
			events: [ 'input' ],
			toSignal: ( el, signalType ) =>
				signalType === 'number'
					? +( el as HTMLTextAreaElement ).value
					: ( el as HTMLTextAreaElement ).value,
		};
	}

	// text, email, password, search, url, tel, …
	return {
		prop: 'value',
		events: [ 'input' ],
		toSignal: ( el, signalType ) =>
			signalType === 'number'
				? +( el as HTMLInputElement ).value
				: ( el as HTMLInputElement ).value,
	};
};

const syncElementProp = (
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	desc: BindDescriptor,
	value: unknown,
	props: Record< string, unknown >
) => {
	const propValue = desc.fromSignal ? desc.fromSignal( value, props ) : value;

	if ( element instanceof HTMLSelectElement && element.multiple ) {
		const selectedValues = new Set(
			Array.isArray( propValue ) ? propValue.map( String ) : []
		);
		Array.from( element.options ).forEach( ( option ) => {
			option.selected = selectedValues.has( option.value );
		} );
		return;
	}

	( element as any )[ desc.prop ] =
		propValue === null || propValue === undefined ? '' : propValue;
};

/* ------------------------------------------------------------------ */
/*  Directive                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  writeSignal / readSignal helpers                                   */
/* ------------------------------------------------------------------ */

/**
 * Writes a value to the signal at the given path (e.g. `'state.text'` or
 * `'context.item.name'`).  Captures the store/context root at render time
 * so it works correctly both during render and in event handlers.
 *
 * The helper navigates through the proxy normally (no peek), so each
 * intermediate key returns a proxified nested object, and the final leaf
 * assignment goes through the proxy's set/defineProperty traps → reactive.
 * @param ns
 * @param path
 * @param stateRoot
 * @param contextRoot
 */
const createSignalWriter = (
	ns: string,
	path: string,
	stateRoot: Record< string, unknown >,
	contextRoot: object | undefined
) => {
	const parts = path.split( '.' );
	const leaf = parts.pop()!;
	const rootKey = parts[ 0 ];

	if ( rootKey === 'state' ) {
		return ( value: unknown ) => {
			let obj: any = stateRoot;
			for ( const key of parts ) {
				obj = obj[ key ];
			}
			obj[ leaf ] = value;
		};
	}

	if ( rootKey === 'context' ) {
		if ( ! contextRoot ) {
			return () => undefined;
		}
		// For context paths the root IS the context; drop the 'context'
		// segment.
		const ctxParts = parts.slice( 1 );
		return ( value: unknown ) => {
			let obj: any = contextRoot;
			for ( const key of ctxParts ) {
				obj = obj[ key ];
			}
			obj[ leaf ] = value;
		};
	}

	return () => undefined;
};

/**
 * Reads the current value at the given path using `peek` (non-subscribing).
 * Used inside the layout effect for signal→element sync.
 * @param ns
 * @param path
 * @param stateRoot
 * @param contextRoot
 */
const createSignalReader = (
	ns: string,
	path: string,
	stateRoot: Record< string, unknown >,
	contextRoot: object | undefined
) => {
	const parts = path.split( '.' );
	const leaf = parts.pop()!;
	const rootKey = parts[ 0 ];

	if ( rootKey === 'state' ) {
		return () => {
			let obj: any = stateRoot;
			for ( const key of parts ) {
				if ( obj === null || obj === undefined ) {
					return undefined;
				}
				obj = peek( obj, key );
			}
			if ( obj === null || obj === undefined ) {
				return undefined;
			}
			return peek( obj, leaf );
		};
	}

	if ( rootKey === 'context' ) {
		if ( ! contextRoot ) {
			return () => undefined;
		}
		const ctxParts = parts.slice( 1 );
		return () => {
			let obj: any = contextRoot;
			for ( const key of ctxParts ) {
				if ( obj === null || obj === undefined ) {
					return undefined;
				}
				obj = peek( obj, key );
			}
			if ( obj === null || obj === undefined ) {
				return undefined;
			}
			return peek( obj, leaf );
		};
	}

	return () => undefined;
};

directive( 'input', ( { directives, element, evaluate } ) => {
	const entries = directives.input;
	const entry = entries.find( isDefaultDirectiveSuffix );
	if ( ! entry || typeof entry.value !== 'string' ) {
		return;
	}

	const path = entry.value;
	const props = element.props as Record< string, unknown >;

	// Create write/read roots at render time (scope is active).
	// NOTE: these are created early so file input and all other code paths
	// can share the same write mechanism.  They do not depend on signalValue.

	const stateRoot = store( entry.namespace );

	const contextRoot = path.startsWith( 'context.' )
		? getContext( entry.namespace )
		: undefined;

	const writeSignal = createSignalWriter(
		entry.namespace,
		path,
		stateRoot,
		contextRoot
	);
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const readSignal = createSignalReader(
		entry.namespace,
		path,
		stateRoot,
		contextRoot
	);

	// ---- file inputs – handled via useInit + FileReader ----
	if ( ( props.type as string | undefined ) === 'file' ) {
		useInit( () => {
			const el = ( element.ref as { current?: HTMLInputElement } )
				.current;
			if ( ! el ) {
				return;
			}

			const syncFiles = () => {
				const files = [ ...( el.files || [] ) ];
				Promise.all(
					files.map(
						( f ) =>
							new Promise< SignalFile >( ( resolve ) => {
								const reader = new FileReader();
								reader.onload = () => {
									const result =
										typeof reader.result === 'string'
											? reader.result
											: '';
									const match = result.match( dataURIRegex );
									if ( globalThis.SCRIPT_DEBUG ) {
										if ( ! match?.groups ) {
											warn(
												'data-wp-input: Invalid data URI for file input.'
											);
										}
									}
									resolve( {
										name: f.name,
										contents: match?.groups?.contents ?? '',
										mime: match?.groups?.mime ?? '',
									} );
								};
								reader.readAsDataURL( f );
							} )
					)
				).then( ( signalFiles ) => {
					writeSignal( signalFiles );
				} );
			};

			el.addEventListener( 'change', syncFiles );
			return () => el.removeEventListener( 'change', syncFiles );
		} );
		return;
	}

	// ---- read signal, detect type ----
	const signalValue = evaluate( entry );
	if ( signalValue === PENDING_GETTER ) {
		return;
	}

	const elementType =
		typeof element.type === 'string' ? element.type.toLowerCase() : null;
	const desc = detectDescriptor( elementType, props );
	const signalType = typeof signalValue;

	// ---- set initial element prop (VDOM will diff) ----
	if ( signalValue !== undefined && signalValue !== null ) {
		props[ desc.prop ] = desc.fromSignal
			? desc.fromSignal( signalValue, props )
			: signalValue;
	} else if ( props.value !== undefined && desc.prop === 'value' ) {
		props[ desc.prop ] = props.value;
	}

	// ---- initial DOM sync: seed & element sync ----
	useLayoutEffect( () => {
		const el = ( element.ref as { current?: InputBindingElement } ).current;
		if ( ! el ) {
			return;
		}

		// Radio auto-name (Datastar parity: native grouping when name absent).
		if (
			el instanceof HTMLInputElement &&
			el.type === 'radio' &&
			! el.name
		) {
			el.name = path;
		}

		// Element→signal seeding (ifMissing: adopt DOM value when signal is
		// undefined — Datastar's `boundPath` + `mergePaths({ ifMissing })`).
		if ( signalValue === undefined ) {
			const elValue = desc.toSignal( el, 'undefined' );
			if ( elValue !== undefined ) {
				writeSignal( elValue );
			}
		}

		// Signal→element sync (re-read current value via peek — avoids
		// evaluate/scope issues inside effects).
		const current = readSignal();
		if (
			current !== null &&
			current !== undefined &&
			current !== PENDING_GETTER
		) {
			syncElementProp( el, desc, current, props );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ signalValue ] );

	// ---- wire up event handlers ----
	for ( const eventName of desc.events ) {
		const propName = `on${ eventName }` as string;
		const existing = props[ propName ] as
			| ( ( e: Event ) => void )
			| undefined;

		props[ propName ] = ( event: Event ) => {
			if ( existing ) {
				existing( event );
			}

			const target = event.target as
				| HTMLInputElement
				| HTMLSelectElement
				| HTMLTextAreaElement;
			const raw = desc.toSignal( target, signalType );

			if ( raw === undefined ) {
				return;
			}

			writeSignal( raw );
		};
	}
} );
