/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import Control from './control';

export default function Form( {
	title,
	isVisible,
	id,
	idBase,
	instance,
	isWide,
	onChangeInstance,
	onChangeHasPreview,
} ) {
	const ref = useRef();

	const isMediumLargeViewport = useViewportMatch( 'small' );

	// We only want to remount the control when the instance changes
	// *externally*. For example, if the user performs an undo. To do this, we
	// keep track of changes made to instance by the control itself and then
	// ignore those.
	const outgoingInstances = useRef( new Set() );
	const incomingInstances = useRef( new Set() );

	const { createNotice } = useDispatch( noticesStore );

	useEffect( () => {
		if ( incomingInstances.current.has( instance ) ) {
			incomingInstances.current.delete( instance );
			return;
		}

		const control = new Control( {
			id,
			idBase,
			instance,
			onChangeInstance( nextInstance ) {
				outgoingInstances.current.add( instance );
				incomingInstances.current.add( nextInstance );
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
			if ( outgoingInstances.current.has( instance ) ) {
				outgoingInstances.current.delete( instance );
				return;
			}

			control.destroy();
		};
	}, [
		id,
		idBase,
		instance,
		onChangeInstance,
		onChangeHasPreview,
		isMediumLargeViewport,
	] );

	if ( isWide && isMediumLargeViewport ) {
		return (
			<div className="wp-block-legacy-widget__container">
				{ isVisible && (
					<h3 className="wp-block-legacy-widget__edit-form-title">
						{ title }
					</h3>
				) }
				<Popover
					focusOnMount={ false }
					position="middle right"
					__unstableForceXAlignment
				>
					<div
						ref={ ref }
						className="wp-block-legacy-widget__edit-form"
						hidden={ ! isVisible }
					></div>
				</Popover>
			</div>
		);
	}

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
