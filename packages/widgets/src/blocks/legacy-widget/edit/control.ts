import apiFetch from '@wordpress/api-fetch';
import { debounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

interface JQueryWrapper {
	on: {
		(
			event: string,
			selector: string | null,
			handler: ( event: Event ) => void
		): void;
		( event: string, handler: ( event: Event ) => void ): void;
	};
	off: {
		(
			event: string,
			selector: string | null,
			handler: ( event: Event ) => void
		): void;
		( event: string, handler: ( event: Event ) => void ): void;
	};
	trigger: ( event: string, extra?: unknown[] ) => void;
}

declare global {
	interface Window {
		jQuery?: (
			element: Document | Element | JQueryWrapper
		) => JQueryWrapper;
	}
}

interface ControlParams {
	id?: string | null;
	idBase?: string | null;
	instance?: Record< string, unknown > | null;
	onChangeInstance: ( instance: Record< string, unknown > ) => void;
	onChangeHasPreview: ( hasPreview: boolean ) => void;
	onError: ( error: unknown ) => void;
}

interface WidgetResponse {
	rendered_form: string;
}

interface EncodeWidgetResponse {
	instance: Record< string, unknown >;
	form: string;
	preview: string;
}

/**
 * An API for creating and loading a widget control (a <div class="widget">
 * element) that is compatible with most third party widget scripts. By not
 * using React for this, we ensure that we have complete control over the DOM
 * and do not accidentally remove any elements that a third party widget script
 * has attached an event listener to.
 */
export default class Control {
	id?: string | null;
	idBase?: string | null;
	private _instance?: Record< string, unknown > | null;
	private _hasPreview: boolean | null;
	onChangeInstance: ( instance: Record< string, unknown > ) => void;
	onChangeHasPreview: ( hasPreview: boolean ) => void;
	onError: ( error: unknown ) => void;
	number: number;
	element!: HTMLDivElement;
	form!: HTMLFormElement;
	content!: HTMLDivElement;

	constructor( {
		id,
		idBase,
		instance,
		onChangeInstance,
		onChangeHasPreview,
		onError,
	}: ControlParams ) {
		this.id = id;
		this.idBase = idBase;
		this._instance = instance;
		this._hasPreview = null;
		this.onChangeInstance = onChangeInstance;
		this.onChangeHasPreview = onChangeHasPreview;
		this.onError = onError;

		// We can't use the real widget number as this is calculated by the
		// server and we may not ever *actually* save this widget. Instead, use
		// a fake but unique number.
		this.number = ++lastNumber;

		this.handleFormChange = debounce(
			this.handleFormChange.bind( this ),
			200
		);
		this.handleFormSubmit = this.handleFormSubmit.bind( this );

		this.initDOM();
		this.bindEvents();
		this.loadContent();
	}

	/**
	 * Clean up the control so that it can be garbage collected.
	 */
	destroy() {
		this.unbindEvents();
		this.element.remove();
		// TODO: How do we make third party widget scripts remove their event
		// listeners?
	}

	/**
	 * Creates the control's DOM structure.
	 */
	initDOM() {
		this.element = el( 'div', { class: 'widget open' }, [
			el( 'div', { class: 'widget-inside' }, [
				( this.form = el( 'form', { class: 'form', method: 'post' }, [
					// These hidden form inputs are what most widgets' scripts
					// use to access data about the widget.
					el( 'input', {
						class: 'widget-id',
						type: 'hidden',
						name: 'widget-id',
						value: this.id ?? `${ this.idBase }-${ this.number }`,
					} ),
					el( 'input', {
						class: 'id_base',
						type: 'hidden',
						name: 'id_base',
						value: this.idBase ?? this.id ?? '',
					} ),
					el( 'input', {
						class: 'widget-width',
						type: 'hidden',
						name: 'widget-width',
						value: '250',
					} ),
					el( 'input', {
						class: 'widget-height',
						type: 'hidden',
						name: 'widget-height',
						value: '200',
					} ),
					el( 'input', {
						class: 'widget_number',
						type: 'hidden',
						name: 'widget_number',
						value: this.idBase ? this.number.toString() : '',
					} ),
					( this.content = el( 'div', { class: 'widget-content' } ) ),
					// Non-multi widgets can be saved via a Save button.
					this.id
						? el(
								'button',
								{
									class: 'button is-primary',
									type: 'submit',
								},
								__( 'Save' )
							)
						: null,
				] ) ),
			] ),
		] );
	}

	/**
	 * Adds the control's event listeners.
	 */
	bindEvents() {
		// Prefer jQuery 'change' event instead of the native 'change' event
		// because many widgets use jQuery's event bus to trigger an update.
		if ( window.jQuery ) {
			const { jQuery: $ } = window;
			$( this.form ).on( 'change', null, this.handleFormChange );
			$( this.form ).on( 'input', null, this.handleFormChange );
			$( this.form ).on( 'submit', this.handleFormSubmit );
		} else {
			this.form.addEventListener( 'change', this.handleFormChange );
			this.form.addEventListener( 'input', this.handleFormChange );
			this.form.addEventListener( 'submit', this.handleFormSubmit );
		}
	}

	/**
	 * Removes the control's event listeners.
	 */
	unbindEvents() {
		if ( window.jQuery ) {
			const { jQuery: $ } = window;
			$( this.form ).off( 'change', null, this.handleFormChange );
			$( this.form ).off( 'input', null, this.handleFormChange );
			$( this.form ).off( 'submit', this.handleFormSubmit );
		} else {
			this.form.removeEventListener( 'change', this.handleFormChange );
			this.form.removeEventListener( 'input', this.handleFormChange );
			this.form.removeEventListener( 'submit', this.handleFormSubmit );
		}
	}

	/**
	 * Fetches the widget's form HTML from the REST API and loads it into the
	 * control's form.
	 */
	async loadContent() {
		try {
			if ( this.id ) {
				const { form } = await saveWidget( this.id );
				this.content.innerHTML = form;
			} else if ( this.idBase ) {
				const { form, preview } = await encodeWidget( {
					idBase: this.idBase,
					instance: this.instance,
					number: this.number,
				} );
				this.content.innerHTML = form;
				this.hasPreview = ! isEmptyHTML( preview );

				// If we don't have an instance, perform a save right away. This
				// happens when creating a new Legacy Widget block.
				if ( ! this.instance?.hash ) {
					const { instance } = await encodeWidget( {
						idBase: this.idBase,
						instance: this.instance,
						number: this.number,
						formData: serializeForm( this.form ),
					} );
					this.instance = instance;
				}
			}

			// Trigger 'widget-added' when widget is ready. This event is what
			// widgets' scripts use to initialize, attach events, etc. The event
			// must be fired using jQuery's event bus as this is what widget
			// scripts expect. If jQuery is not loaded, do nothing - some
			// widgets will still work regardless.
			if ( window.jQuery ) {
				const { jQuery: $ } = window;
				$( document ).trigger( 'widget-added', [ $( this.element ) ] );
			}
		} catch ( error ) {
			this.onError( error );
		}
	}

	/**
	 * Perform a save when a multi widget's form is changed. Non-multi widgets are
	 * saved manually.
	 */
	handleFormChange() {
		if ( this.idBase ) {
			this.saveForm();
		}
	}

	/**
	 * Perform a save when the control's form is manually submitted.
	 *
	 * @param event Form submit event.
	 */
	handleFormSubmit( event: Event ) {
		event.preventDefault();
		this.saveForm();
	}

	/**
	 * Serialize the control's form, send it to the REST API, and update the
	 * instance with the encoded instance that the REST API returns.
	 */
	async saveForm() {
		const formData = serializeForm( this.form );

		try {
			if ( this.id ) {
				const { form } = await saveWidget( this.id, formData );
				this.content.innerHTML = form;

				if ( window.jQuery ) {
					const { jQuery: $ } = window;
					$( document ).trigger( 'widget-updated', [
						$( this.element ),
					] );
				}
			} else if ( this.idBase ) {
				const { instance, preview } = await encodeWidget( {
					idBase: this.idBase,
					instance: this.instance,
					number: this.number,
					formData,
				} );
				this.instance = instance;
				this.hasPreview = ! isEmptyHTML( preview );
			}
		} catch ( error ) {
			this.onError( error );
		}
	}

	/**
	 * The widget's instance object.
	 */
	get instance(): Record< string, unknown > | null | undefined {
		return this._instance;
	}

	/**
	 * The widget's instance object.
	 */
	set instance( instance: Record< string, unknown > ) {
		if ( this._instance !== instance ) {
			this._instance = instance;
			this.onChangeInstance( instance );
		}
	}

	/**
	 * Whether or not the widget can be previewed.
	 */
	get hasPreview(): boolean | null {
		return this._hasPreview;
	}

	/**
	 * Whether or not the widget can be previewed.
	 */
	set hasPreview( hasPreview: boolean ) {
		if ( this._hasPreview !== hasPreview ) {
			this._hasPreview = hasPreview;
			this.onChangeHasPreview( hasPreview );
		}
	}
}

let lastNumber = 0;

function el< K extends keyof HTMLElementTagNameMap >(
	tagName: K,
	attributes: Record< string, string > = {},
	content: Array< Node | null | undefined | false > | string | null = null
): HTMLElementTagNameMap[ K ] {
	const element = document.createElement( tagName );
	for ( const [ attribute, value ] of Object.entries( attributes ) ) {
		element.setAttribute( attribute, value );
	}
	if ( Array.isArray( content ) ) {
		for ( const child of content ) {
			if ( child ) {
				element.appendChild( child );
			}
		}
	} else if ( typeof content === 'string' ) {
		element.innerText = content;
	}
	return element;
}

async function saveWidget( id: string, formData: string | null = null ) {
	let widget: WidgetResponse;
	if ( formData ) {
		widget = await apiFetch< WidgetResponse >( {
			path: `/wp/v2/widgets/${ id }?context=edit`,
			method: 'PUT',
			data: {
				form_data: formData,
			},
		} );
	} else {
		widget = await apiFetch< WidgetResponse >( {
			path: `/wp/v2/widgets/${ id }?context=edit`,
			method: 'GET',
		} );
	}
	return { form: widget.rendered_form };
}

async function encodeWidget( {
	idBase,
	instance,
	number,
	formData = null,
}: {
	idBase: string;
	instance?: Record< string, unknown > | null;
	number: number;
	formData?: string | null;
} ) {
	const response = await apiFetch< EncodeWidgetResponse >( {
		path: `/wp/v2/widget-types/${ idBase }/encode`,
		method: 'POST',
		data: {
			instance,
			number,
			form_data: formData,
		},
	} );
	return {
		instance: response.instance,
		form: response.form,
		preview: response.preview,
	};
}

function isEmptyHTML( html: string ) {
	const element = document.createElement( 'div' );
	element.innerHTML = html;
	return isEmptyNode( element );
}

function isEmptyNode( node: Node ): boolean {
	switch ( node.nodeType ) {
		case Node.TEXT_NODE:
			// Text nodes are empty if it's entirely whitespace.
			return ( node.nodeValue ?? '' ).trim() === '';
		case Node.ELEMENT_NODE: {
			// Elements that are "embedded content" are not empty.
			// https://dev.w3.org/html5/spec-LC/content-models.html#embedded-content-0
			const element = node as Element;
			if (
				[
					'AUDIO',
					'CANVAS',
					'EMBED',
					'IFRAME',
					'IMG',
					'MATH',
					'OBJECT',
					'SVG',
					'VIDEO',
				].includes( element.tagName )
			) {
				return false;
			}
			// Elements with no children are empty.
			if ( ! element.hasChildNodes() ) {
				return true;
			}
			// Elements with children are empty if all their children are empty.
			return Array.from( element.childNodes ).every( isEmptyNode );
		}
		default:
			return true;
	}
}

function serializeForm( form: HTMLFormElement ) {
	return new window.URLSearchParams(
		Array.from( new window.FormData( form ) ) as string[][]
	).toString();
}
