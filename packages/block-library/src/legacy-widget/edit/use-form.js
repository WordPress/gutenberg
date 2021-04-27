/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function useForm( { id, idBase, instance, setInstance } ) {
	const isStillMounted = useRef( false );
	const outgoingInstances = useRef( new Set() );
	const [ content, setContent ] = useState( null );
	const [ hasPreview, setHasPreview ] = useState( null );

	const { createNotice } = useDispatch( noticesStore );

	useEffect( () => {
		isStillMounted.current = true;
		return () => ( isStillMounted.current = false );
	}, [] );

	useEffect( () => {
		if ( outgoingInstances.current.has( instance ) ) {
			outgoingInstances.current.delete( instance );
			return;
		}

		( async () => {
			try {
				if ( id ) {
					const { form } = await saveWidget( id );
					if ( isStillMounted.current ) {
						setContent( form );
					}
				} else if ( idBase ) {
					const { form, preview } = await encodeWidget(
						idBase,
						instance
					);
					if ( isStillMounted.current ) {
						setContent( form );
						setHasPreview( ! isEmptyHTML( preview ) );
					}
				}
			} catch ( error ) {
				createNotice(
					'error',
					error?.message ??
						__( 'An error occured while fetching the widget.' )
				);
			}
		} )();
	}, [ id, idBase, instance ] );

	const setFormData = useCallback(
		async ( formData ) => {
			try {
				if ( id ) {
					const { form } = await saveWidget( id, formData );
					if ( isStillMounted.current ) {
						setContent( form );
					}
				} else if ( idBase ) {
					const {
						instance: nextInstance,
						preview,
					} = await encodeWidget( idBase, instance, formData );
					if ( isStillMounted.current ) {
						outgoingInstances.current.add( nextInstance );
						setInstance( nextInstance );
						setHasPreview( ! isEmptyHTML( preview ) );
					}
				}
			} catch ( error ) {
				createNotice(
					'error',
					error?.message ??
						__( 'An error occured while updating the widget.' )
				);
			}
		},
		[ id, idBase ]
	);

	return { content, setFormData, hasPreview };
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
