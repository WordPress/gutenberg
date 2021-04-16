/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import {
	useEffect,
	useRef,
	useState,
	useCallback,
	RawHTML,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

export default function Form( {
	id,
	idBase,
	instance,
	setInstance,
	setHasPreview,
} ) {
	const { content, setFormData } = useForm( {
		id,
		idBase,
		instance,
		setInstance,
		setHasPreview,
	} );

	const setFormDataDebounced = useCallback( debounce( setFormData, 300 ), [
		setFormData,
	] );

	return (
		<Control
			id={ id }
			idBase={ idBase }
			content={ content }
			onChange={ setFormDataDebounced }
			onSave={ setFormData }
			// Force a remount when the widget's form HTML changes. This clears
			// out any mutations to the DOM that widget scripts have made.
			key={ content.key }
		/>
	);
}

function useForm( { id, idBase, instance, setInstance, setHasPreview } ) {
	const isStillMounted = useRef( false );
	const outgoingInstances = useRef( new Set() );
	const [ content, setContent ] = useState( { html: null, key: 0 } );

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
						setContent( ( { key } ) => ( {
							html: form,
							key: key + 1,
						} ) );
					}
				} else if ( idBase ) {
					const { form, preview } = await encodeWidget(
						idBase,
						instance
					);
					if ( isStillMounted.current ) {
						setContent( ( { key } ) => ( {
							html: form,
							key: key + 1,
						} ) );
						setHasPreview( !! preview );
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
						setContent( ( { key } ) => ( {
							html: form,
							key: key + 1,
						} ) );
					}
				} else if ( idBase ) {
					const {
						instance: nextInstance,
						preview,
					} = await encodeWidget( idBase, instance, formData );
					if ( isStillMounted.current ) {
						outgoingInstances.current.add( nextInstance );
						setInstance( nextInstance );
						setHasPreview( !! preview );
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

	return { content, setFormData };
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

function Control( { id, idBase, content, onChange, onSave } ) {
	const controlRef = useRef();
	const formRef = useRef();

	// Trigger 'widget-added' when widget is ready. This event is what widgets'
	// scripts use to initialize, attach events, etc. The event must be fired
	// using jQuery's event bus as this is what widget scripts expect. If jQuery
	// is not loaded, do nothing - some widgets will still work regardless.
	useEffect( () => {
		if ( ! window.jQuery ) {
			return;
		}

		const { jQuery: $ } = window;

		if ( content.html ) {
			$( document ).trigger( 'widget-added', [
				$( controlRef.current ),
			] );
		}
	}, [ content ] );

	// Prefer jQuery 'change' event instead of the native 'change' event because
	// many widgets use jQuery's event bus to trigger an update.
	useEffect( () => {
		const handler = () => onChange( serializeForm( formRef.current ) );

		if ( window.jQuery ) {
			const { jQuery: $ } = window;
			$( formRef.current ).on( 'change', null, handler );
			return () => $( formRef.current ).off( 'change', null, handler );
		}

		formRef.current.addEventListener( 'change', handler );
		return () => formRef.current.removeEventListener( 'change', handler );
	}, [ onChange ] );

	// Non-multi widgets can be saved via a Save button.
	const handleSubmit = ( event ) => {
		event.preventDefault();
		onSave( serializeForm( event.target ) );
	};

	// We can't use the real widget number as this is calculated by the server
	// and we may not ever *actually* save this widget. Instead, use a fake but
	// unique number.
	const number = useInstanceId( Control );

	return (
		<div ref={ controlRef } className="widget open">
			<div className="widget-inside">
				<form
					ref={ formRef }
					className="form"
					method="post"
					onSubmit={ handleSubmit }
				>
					{ /* Many widgets expect these hidden inputs to exist in the DOM. */ }
					<input
						type="hidden"
						name="widget-id"
						className="widget-id"
						value={ id ?? `${ idBase }-${ number }` }
					/>
					<input
						type="hidden"
						name="id_base"
						className="id_base"
						value={ idBase ?? id }
					/>
					<input
						type="hidden"
						name="widget-width"
						className="widget-width"
						value="250"
					/>
					<input
						type="hidden"
						name="widget-height"
						className="widget-height"
						value="200"
					/>
					<input
						type="hidden"
						name="widget_number"
						className="widget_number"
						value={ idBase ? number : '' }
					/>
					<input
						type="hidden"
						name="add_new"
						className="add_new"
						value=""
					/>
					<RawHTML className="widget-content">
						{ content.html }
					</RawHTML>
					{ id && (
						<Button type="submit" isPrimary>
							{ __( 'Save' ) }
						</Button>
					) }
				</form>
			</div>
		</div>
	);
}

function serializeForm( form ) {
	return new window.URLSearchParams(
		Array.from( new window.FormData( form ) )
	).toString();
}
