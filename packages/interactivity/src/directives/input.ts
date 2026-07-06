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
import { useInit } from '../utils';
import { store } from '../store';
import { PENDING_GETTER } from '../proxies/state';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parses a directive value like "state.foo.bar" and sets the leaf
 * property on the store's state via the proxy, which triggers signal
 * updates.
 *
 * @param ns    The store namespace.
 * @param path  Dot-separated path starting with "state" (e.g. "state.text").
 * @param value The value to assign.
 */
const setStateValue = ( ns: string, path: string, value: unknown ): void => {
	const parts = path.split( '.' ).slice( 1 ); // Remove "state"
	if ( parts.length === 0 ) {
		return;
	}
	const { state } = store( ns );
	let obj: any = state;
	for ( let i = 0; i < parts.length - 1; i++ ) {
		obj = obj[ parts[ i ] ];
	}
	obj[ parts[ parts.length - 1 ] ] = value;
};

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
				if ( signalType === 'boolean' ) {
					return input.checked;
				}
				return input.checked ? input.value : '';
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
					setStateValue(
						entryForFile.namespace,
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

	useInit( () => {
		const el = ( element.ref as { current?: InputBindingElement }).current;
		if ( ! el ) {
			return;
		}

		syncElementProp( el, desc, signalValue, props );
	} );

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

			setStateValue( entry.namespace, entry.value, raw );
		};
	}
} );
