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
import { useInit, useLayoutEffect } from '../utils';
import { store, setByPath } from '../store';
import { PENDING_GETTER } from '../proxies/state';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/* setByPath is imported from ../store */


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
					return signalType === 'boolean'
						? input.checked
						: input.checked
							? input.value
							: '';
				}
				return signalType === 'string'
					? input.checked
						? input.value
						: ''
					: input.checked;
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

	// text, email, password, search, url, tel, textarea, select …
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

directive( 'input', ( { directives, element, evaluate } ) => {
	const entries = directives.input;
	const entry = entries.find( isDefaultDirectiveSuffix );
	if ( ! entry || typeof entry.value !== 'string' ) {
		return;
	}

	const props = element.props as Record< string, unknown >;

	// ---- file inputs – handled via useInit + FileReader ----
	if ( ( props.type as string | undefined ) === 'file' ) {
		const entryForFile = entry;
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
					setByPath(
						store( entryForFile.namespace ),
						entryForFile.value,
						signalFiles
					);
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

	// ---- initial DOM sync (pre-paint): seed & sync ----
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
			el.name = entry.value;
		}

		// Element→signal seeding (ifMissing: adopt DOM value when signal is
		// undefined — Datastar's `boundPath` + `mergePaths({ ifMissing })`).
		if ( signalValue === undefined ) {
			const elValue = desc.toSignal( el, 'undefined' );
			if ( elValue !== undefined ) {
				setByPath( store( entry.namespace ), entry.value, elValue );
			}
		}

		// Signal→element sync (re-read via evaluate in effect context;
		// signal reads inside effects do not subscribe the component).
		const current = evaluate( entry );
		if ( current != null && current !== PENDING_GETTER ) {
			syncElementProp( el, desc, current, props );
		}
	}, [] );

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

			setByPath( store( entry.namespace ), entry.value, raw );
		};
	}
} );
