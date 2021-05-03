/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default function createControl( {
	id,
	idBase,
	instance,
	onChangeInstance,
	onChangeHasPreview,
	onError,
} ) {
	let control, form, content, hasPreview;

	function initDOM() {
		const number = ++lastNumber;

		control = document.createElement( 'div' );
		control.classList.add( 'widget' );
		control.classList.add( 'open' );

		form = document.createElement( 'form' );
		form.classList.add( 'widget-inside' );
		form.setAttribute( 'method', 'post' );
		control.appendChild( form );

		const idInput = document.createElement( 'input' );
		idInput.classList.add( 'widget-id' );
		idInput.setAttribute( 'type', 'hidden' );
		idInput.setAttribute( 'name', 'widget-id' );
		idInput.setAttribute( 'value', id ?? `${ idBase }-${ number }` );
		form.appendChild( idInput );

		const idBaseInput = document.createElement( 'input' );
		idBaseInput.classList.add( 'id_base' );
		idBaseInput.setAttribute( 'type', 'hidden' );
		idBaseInput.setAttribute( 'name', 'id_base' );
		idBaseInput.setAttribute( 'value', idBase ?? id );
		form.appendChild( idBaseInput );

		const widthInput = document.createElement( 'input' );
		widthInput.classList.add( 'widget-width' );
		widthInput.setAttribute( 'type', 'hidden' );
		widthInput.setAttribute( 'name', 'widget-width' );
		widthInput.setAttribute( 'value', '250' );
		form.appendChild( widthInput );

		const heightInput = document.createElement( 'input' );
		heightInput.classList.add( 'widget-height' );
		heightInput.setAttribute( 'type', 'hidden' );
		heightInput.setAttribute( 'name', 'widget-height' );
		heightInput.setAttribute( 'value', '200' );
		form.appendChild( heightInput );

		const numberInput = document.createElement( 'input' );
		numberInput.classList.add( 'widget_number' );
		numberInput.setAttribute( 'type', 'hidden' );
		numberInput.setAttribute( 'name', 'widget_number' );
		numberInput.setAttribute( 'value', idBase ? number.toString() : '' );
		form.appendChild( numberInput );

		content = document.createElement( 'div' );
		content.classList.add( 'widget-content' );
		form.appendChild( content );

		if ( id ) {
			const submitButton = document.createElement( 'button' );
			submitButton.classList.add( 'button' );
			submitButton.classList.add( 'is-primary' );
			submitButton.setAttribute( 'type', 'submit' );
			form.appendChild( submitButton );
		}
	}

	function bindEvents() {
		if ( window.jQuery ) {
			const { jQuery: $ } = window;
			$( form ).on( 'change', null, handleFormChange );
			$( form ).on( 'input', null, handleFormChange );
			$( form ).on( 'submit', handleFormSubmit );
		} else {
			form.addEventListener( 'change', handleFormChange );
			form.addEventListener( 'input', handleFormChange );
			form.addEventListener( 'submit', handleFormSubmit );
		}
	}

	function unbindEvents() {
		if ( window.jQuery ) {
			const { jQuery: $ } = window;
			$( form ).off( 'change', null, handleFormChange );
			$( form ).off( 'input', null, handleFormChange );
			$( form ).off( 'submit', handleFormSubmit );
		} else {
			form.removeEventListener( 'change', handleFormChange );
			form.removeEventListener( 'input', handleFormChange );
			form.removeEventListener( 'submit', handleFormSubmit );
		}
	}

	async function loadContent() {
		try {
			if ( id ) {
				const { form: contentHTML } = await saveWidget( id );
				content.innerHTML = contentHTML;
			} else if ( idBase ) {
				const { form: contentHTML, preview } = await encodeWidget(
					idBase,
					instance
				);
				content.innerHTML = contentHTML;
				setHasPreview( ! isEmptyHTML( preview ) );

				if ( ! instance.hash ) {
					const { instance: nextInstance } = await encodeWidget(
						idBase,
						instance,
						serializeForm( form )
					);
					setInstance( nextInstance );
				}
			}

			if ( window.jQuery ) {
				const { jQuery: $ } = window;
				$( document ).trigger( 'widget-added', [ $( this.element ) ] );
			}
		} catch ( error ) {
			onError( error );
		}
	}

	const handleFormChange = debounce( () => {
		saveForm();
	}, 200 );

	function handleFormSubmit( event ) {
		event.preventDefault();
		saveForm();
	}

	async function saveForm() {
		const formData = serializeForm( form );

		try {
			if ( id ) {
				const { form: contentHTML } = await saveWidget( id, formData );
				content.innerHTML = contentHTML;

				if ( window.jQuery ) {
					const { jQuery: $ } = window;
					$( document ).trigger( 'widget-updated', [ $( control ) ] );
				}
			} else if ( idBase ) {
				const { instance: nextInstance, preview } = await encodeWidget(
					idBase,
					instance,
					formData
				);
				setInstance( nextInstance );
				setHasPreview( ! isEmptyHTML( preview ) );
			}
		} catch ( error ) {
			onError( error );
		}
	}

	function setInstance( nextInstance ) {
		if ( instance !== nextInstance ) {
			instance = nextInstance;
			onChangeInstance( instance );
		}
	}

	function setHasPreview( nextHasPreview ) {
		if ( hasPreview !== nextHasPreview ) {
			hasPreview = nextHasPreview;
			onChangeHasPreview( hasPreview );
		}
	}

	initDOM();
	bindEvents();
	loadContent();

	return { element: control, destroy: unbindEvents };
}

let lastNumber = 0;

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
