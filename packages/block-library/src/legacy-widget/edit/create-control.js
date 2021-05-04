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

		control = el( 'div', { class: 'widget open' }, [
			( form = el( 'form', { class: 'widget-inside', method: 'post' }, [
				el( 'input', {
					class: 'widget-id',
					type: 'hidden',
					name: 'widget-id',
					value: id ?? `${ idBase }-${ number }`,
				} ),
				el( 'input', {
					class: 'id_base',
					type: 'hidden',
					name: 'id_base',
					value: idBase ?? id,
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
					value: idBase ? number.toString() : '',
				} ),
				( content = el( 'div', { class: 'widget-content' } ) ),
				id &&
					el( 'button', {
						class: 'button is-primary',
						type: 'submit',
					} ),
			] ) ),
		] );
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
