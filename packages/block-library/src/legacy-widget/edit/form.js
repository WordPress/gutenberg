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

const $ = window.jQuery;

export default function Form( { id, idBase, instance, setInstance } ) {
	const { html, setFormData } = useForm( {
		id,
		idBase,
		instance,
		setInstance,
	} );

	const setFormDataDebounced = useCallback(
		debounce( setFormData, 300 ),
		[]
	);

	return (
		<Control
			id={ id }
			idBase={ idBase }
			html={ html }
			onChange={ setFormDataDebounced }
			onSave={ setFormData }
		/>
	);
}

function useForm( { id, idBase, instance, setInstance } ) {
	const isStillMounted = useRef( false );
	const [ html, setHTML ] = useState( null );
	const [ formData, setFormData ] = useState( null );

	useEffect( () => {
		isStillMounted.current = true;
		return () => ( isStillMounted.current = false );
	}, [] );

	const { createNotice } = useDispatch( noticesStore );

	useEffect( () => {
		const performFetch = async () => {
			if ( id ) {
				// Updating a widget that does not extend WP_Widget.
				try {
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
					if ( isStillMounted.current ) {
						setHTML( widget.rendered_form );
					}
				} catch ( error ) {
					createNotice(
						'error',
						error?.message ??
							__( 'An error occured while updating the widget.' )
					);
				}
			} else if ( idBase ) {
				// Updating a widget that extends WP_Widget.
				try {
					const response = await apiFetch( {
						path: `/wp/v2/widget-types/${ idBase }/encode`,
						method: 'POST',
						data: {
							instance,
							form_data: formData,
						},
					} );
					if ( isStillMounted.current ) {
						setInstance( response.instance );
						// Only set HTML the first time so that we don't cause a
						// focus loss by remounting the form.
						setHTML(
							( previousHTML ) => previousHTML ?? response.form
						);
					}
				} catch ( error ) {
					createNotice(
						'error',
						error?.message ??
							__( 'An error occured while updating the widget.' )
					);
				}
			}
		};
		performFetch();
	}, [
		id,
		idBase,
		setInstance,
		formData,
		// Do not trigger when `instance` changes so that we don't make two API
		// requests when there is form input.
	] );

	return { html, setFormData };
}

function Control( { id, idBase, html, onChange, onSave } ) {
	const ref = useRef();

	// Trigger widget-added when widget is ready and widget-updated when widget
	// changes. This event is what widgets' scripts use to initialize, attach
	// events, etc.
	const hasBeenAdded = useRef( false );
	useEffect( () => {
		if ( html ) {
			$( document ).trigger(
				hasBeenAdded.current ? 'widget-updated' : 'widget-added',
				[ $( ref.current ) ]
			);
			hasBeenAdded.current = true;
		}
	}, [
		html,
		// Include id and idBase in the deps so that widget-updated is triggered
		// if they change.
		id,
		idBase,
	] );

	// Use jQuery change event instead of the native change event because many
	// widgets use jQuery's trigger() to trigger an update.
	useEffect( () => {
		const form = ref.current.querySelector( 'form' );
		const handler = () => onChange( serializeForm( form ) );
		$( form ).on( 'change', null, handler );
		return () => $( form ).off( 'change', null, handler );
	}, [ onChange ] );

	// Non-multi widgets can be saved via a Save button.
	const handleSubmit = useCallback( ( event ) => {
		event.preventDefault();
		onSave( serializeForm( event.target ) );
	}, [ onSave ] );

	// We can't use the real widget number as this is calculated by the server
	// and we may not ever *actually* save this widget. Instead, use a fake but
	// unique number.
	const number = useInstanceId( Control );

	return (
		<div ref={ ref } className="widget open">
			<div className="widget-inside">
				<form className="form" method="post" onSubmit={ handleSubmit }>
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
					<RawHTML className="widget-content">{ html }</RawHTML>
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
