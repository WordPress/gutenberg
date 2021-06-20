/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import {
	useViewportMatch,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
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
				window.console.error( error );
				createNotice(
					'error',
					sprintf(
						/* translators: %s: the name of the affected block. */
						__(
							'The "%s" block was affected by errors and may not function properly. Check the developer tools for more details.'
						),
						idBase || id
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

	const [ dialogRef, dialogProps ] = useDialog( {
		focusOnMount: false,
	} );

	if ( isWide && isMediumLargeViewport ) {
		return (
			<div className="wp-block-legacy-widget__container">
				{ isVisible && (
					<h3 className="wp-block-legacy-widget__edit-form-title">
						{ title }
					</h3>
				) }
				<div
					className={ classnames(
						'wp-block-legacy-widget__edit-form',
						'is-wide',
						{
							'is-visible': isVisible,
						}
					) }
					ref={ dialogRef }
					{ ...dialogProps }
				>
					<div ref={ ref } hidden={ ! isVisible }></div>
				</div>
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
