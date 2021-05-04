/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default class Control {
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

	destroy() {
		this.unbindEvents();
		this.element.remove();
	}

	initDOM() {
		const number = ++lastNumber;

		this.element = el( 'div', { class: 'widget open' }, [
			el( 'div', { class: 'widget-inside' }, [
				( this.form = el( 'form', { class: 'form', method: 'post' }, [
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
					this.id &&
						el( 'button', {
							class: 'button is-primary',
							type: 'submit',
						} ),
				] ) ),
			] ),
		] );
	}

	bindEvents() {
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

				if ( ! this.instance.hash ) {
					const { instance } = await encodeWidget(
						this.idBase,
						this.instance,
						serializeForm( this.form )
					);
					this.instance = instance;
				}
			}

			if ( window.jQuery ) {
				const { jQuery: $ } = window;
				$( document ).trigger( 'widget-added', [ $( this.element ) ] );
			}
		} catch ( error ) {
			this.onError( error );
		}
	}

	handleFormSubmit( event ) {
		event.preventDefault();
		this.saveForm();
	}

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

	get instance() {
		return this._instance;
	}

	set instance( instance ) {
		if ( this._instance !== instance ) {
			this._instance = instance;
			this.onChangeInstance( instance );
		}
	}

	get hasPreview() {
		return this._hasPreview;
	}

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
