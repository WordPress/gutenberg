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
	forwardRef,
	RawHTML,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';

export default function Form( { id, idBase, instance, setInstance } ) {
	const ref = useRef();

	const { html, setFormData } = useForm( {
		id,
		idBase,
		instance,
		setInstance,
	} );

	const onSubmit = useCallback(
		( event ) => {
			event.preventDefault();
			if ( id ) {
				setFormData( serializeForm( ref.current ) );
			}
		},
		[ id ]
	);

	const onChange = useCallback(
		debounce( () => {
			if ( idBase ) {
				setFormData( serializeForm( ref.current ) );
			}
		}, 300 ),
		[ idBase ]
	);

	return (
		<div className="widget open">
			<div className="widget-inside">
				<ObservableForm
					ref={ ref }
					className="form"
					method="post"
					onSubmit={ onSubmit }
					onChange={ onChange }
				>
					<RawHTML className="widget-content">{ html }</RawHTML>
					{ id && (
						<Button type="submit" isPrimary>
							{ __( 'Save' ) }
						</Button>
					) }
				</ObservableForm>
			</div>
		</div>
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

function serializeForm( form ) {
	return new window.URLSearchParams(
		Array.from( new window.FormData( form ) )
	).toString();
}

const ObservableForm = forwardRef( ( { onChange, ...props }, ref ) => {
	// React won't call the form's onChange handler because it doesn't know
	// about the <input>s that we add using dangerouslySetInnerHTML. We work
	// around this by not using React's event system.

	useEffect( () => {
		const handler = () => onChange( ref.current );
		ref.current.addEventListener( 'change', handler );
		ref.current.addEventListener( 'input', handler );
		return () => {
			ref.current.removeEventListener( 'change', handler );
			ref.current.removeEventListener( 'input', handler );
		};
	}, [ onChange ] );

	return <form ref={ ref } { ...props } />;
} );
