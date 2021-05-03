/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import createControl from './create-control';

export default function Form( {
	title,
	isVisible,
	id,
	idBase,
	instance,
	onChangeInstance,
	onChangeHasPreview,
} ) {
	const ref = useRef();
	const outgoingInstances = useRef( new Set() );

	const { createNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( outgoingInstances.current.has( instance ) ) {
			outgoingInstances.current.delete( instance );
			return;
		}

		const control = createControl( {
			id,
			idBase,
			instance,
			onChangeInstance( nextInstance ) {
				outgoingInstances.current.add( nextInstance );
				onChangeInstance( nextInstance );
			},
			onChangeHasPreview,
			onError( error ) {
				createNotice(
					'error',
					error?.message ??
						__(
							'An error occured while fetching or updating the widget.'
						)
				);
			},
		} );

		ref.current.appendChild( control.element );

		return () => {
			ref.current.removeChild( control.element );
			control.destroy();
		};
	}, [] );

	return (
		<div
			ref={ ref }
			className="wp-block-legacy-widget__edit-form"
			hidden={ ! isVisible }
		>
			<h3 className="wp-block-legacy-widget__edit-form-title">
				{ title }
			</h3>
		</div>
	);
}
