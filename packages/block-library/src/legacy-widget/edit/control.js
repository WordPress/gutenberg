/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * An API for creating and loading a widget control (a <div class="widget">
 * element) that is compatible with most third party widget scripts. By not
 * using React for this, we ensure that we have complete contorl over the DOM
 * and do not accidentally remove any elements that a third party widget script
 * has attached an event listener to.
 *
 * @property {Element} element The control's DOM element.
 */
export default class Control {
	/**
	 * Creates and loads a new control.
	 *
	 * @access public
	 * @param {Object} params
	 * @param {string} params.id
	 * @param {string} params.idBase
	 * @param {Object} params.instance
	 * @param {Function} params.onChangeInstance
	 * @param {Function} params.onChangeHasPreview
	 * @param {Function} params.onError
	 */
	constructor( {
		id,
		idBase,
		instance,
		onChangeInstance,
		onChangeHasPreview,
		onError,
	} ) {
		this.id = id;
		this.idBase = idBase;
		this._instance = instance;
		this._hasPreview = false;
		this.onChangeInstance = onChangeInstance;
		this.onChangeHasPreview = onChangeHasPreview;
		this.onError = onError;

		this.handleFormChange = debounce( this.saveForm.bind( this ), 200 );
		this.handleFormSubmit = this.handleFormSubmit.bind( this );

		this.initDOM();
		this.bindEvents();
		this.loadContent();
	}

	/**
	 * Clean up the control so that it can be garabge collected.
	 *
	 * @access public
	 */
	destroy() {
		this.unbindEvents();
		this.element.remove();
		// TODO: How do we make third party widget scripts remove their event
		// listeners?
	}

	/**
	 * Creates the control's DOM structure.
	 *
	 * @access private
	 */
	initDOM() {
		// We can't use the real widget number as this is calculated by the
		// server and we may not ever *actually* save this widget. Instead, use
		// a fake but unique number.
		const number = ++lastNumber;

		this.element = el( 'div', { class: 'widget open' }, [
			el( 'div', { class: 'widget-inside' }, [
				( this.form = el( 'form', { class: 'form', method: 'post' }, [
					// These hidden form inputs are what most widgets' scripts
					// use to access data about the widget.
					el( 'input', {
						class: 'widget-id',
						type: 'hidden',
						name: 'widget-id',
						value: this.id ?? `${ this.idBase }-${ number }`,
					} ),
					el( 'input', {
						class: 'id_base',
						type: 'hidden',
						name: 'id_base',
						value: this.idBase ?? this.id,
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
						value: this.idBase ? number.toString() : '',
					} ),
					( this.content = el( 'div', { class: 'widget-content' } ) ),
					// Non-multi widgets can be saved via a Save button.
					this.id &&
						el( 'button', {
							class: 'button is-primary',
							type: 'submit',
						} ),
				] ) ),
			] ),
		] );
	}

	/**
	 * Adds the control's event listeners.
	 *
	 * @access private
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
	 *
	 * @access private
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
	 *
	 * @access private
	 */
	async loadContent() {
		try {
			if ( this.id ) {
				const { form } = await saveWidget( this.id );
				this.content.innerHTML = form;
			} else if ( this.idBase ) {
				const { form, preview } = await encodeWidget(
					this.idBase,
					this.instance
				);
				this.content.innerHTML = form;
				this.hasPreview = ! isEmptyHTML( preview );

				// If we don't have an instance, perform a save right away. This
				// happens when creating a new Legacy Widget block.
				if ( ! this.instance.hash ) {
					const { instance } = await encodeWidget(
						this.idBase,
						this.instance,
						serializeForm( this.form )
					);
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
	 * Perform a save when the control's form is manually submitted.
	 *
	 * @access private
	 * @param {Event} event
	 */
	handleFormSubmit( event ) {
		event.preventDefault();
		this.saveForm();
	}

	/**
	 * Serialize the control's form, send it to the REST API, and update the
	 * instance with the encoded instance that the REST API returns.
	 *
	 * @access private
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
				const { instance, preview } = await encodeWidget(
					this.idBase,
					this.instance,
					formData
				);
				this.instance = instance;
				this.hasPreview = ! isEmptyHTML( preview );
			}
		} catch ( error ) {
			this.onError( error );
		}
	}

	/**
	 * The widget's instance object.
	 *
	 * @access private
	 */
	get instance() {
		return this._instance;
	}

	/**
	 * The widget's instance object.
	 *
	 * @access private
	 */
	set instance( instance ) {
		if ( this._instance !== instance ) {
			this._instance = instance;
			this.onChangeInstance( instance );
		}
	}

	/**
	 * Whether or not the widget can be previewed.
	 *
	 * @access public
	 */
	get hasPreview() {
		return this._hasPreview;
	}

	/**
	 * Whether or not the widget can be previewed.
	 *
	 * @access private
	 */
	set hasPreview( hasPreview ) {
		if ( this._hasPreview !== hasPreview ) {
			this._hasPreview = hasPreview;
			this.onChangeHasPreview( hasPreview );
		}
	}
}

let lastNumber = 0;

function el( tagName, attributes = {}, children = [] ) {
	const element = document.createElement( tagName );
	for ( const [ attribute, value ] of Object.entries( attributes ) ) {
		element.setAttribute( attribute, value );
	}
	for ( const child of children ) {
		if ( child ) {
			element.appendChild( child );
		}
	}
	return element;
}

async function saveWidget( id, formData = null ) {
	let widget;
	if ( formData ) {
		widget = await apiFetch( {
			path: `/wp/v2/widgets/${ id }?context=edit`,
			method: 'PUT',
			data: {
				form_data: formData,
			},
		} );
	} else {
		widget = await apiFetch( {
			path: `/wp/v2/widgets/${ id }?context=edit`,
			method: 'GET',
		} );
	}
	return { form: widget.rendered_form };
}

async function encodeWidget( idBase, instance, formData = null ) {
	const response = await apiFetch( {
		path: `/wp/v2/widget-types/${ idBase }/encode`,
		method: 'POST',
		data: {
			instance,
			form_data: formData,
		},
	} );
	return {
		instance: response.instance,
		form: response.form,
		preview: response.preview,
	};
}

function isEmptyHTML( html ) {
	const element = document.createElement( 'div' );
	element.innerHTML = html;
	return element.innerText.trim() === '';
}

function serializeForm( form ) {
	return new window.URLSearchParams(
		Array.from( new window.FormData( form ) )
	).toString();
}
