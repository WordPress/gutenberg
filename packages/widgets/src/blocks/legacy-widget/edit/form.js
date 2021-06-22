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
import { Button, Fill } from '@wordpress/components';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { closeSmall } from '@wordpress/icons';
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
	onClose,
} ) {
	const ref = useRef();

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
	}, [ id, idBase, instance, onChangeInstance, onChangeHasPreview, isWide ] );

	const [ dialogRef, dialogProps ] = useDialog( { focusOnMount: false } );

	if ( isWide ) {
		return (
			<div
				className={ classnames( 'wp-block-legacy-widget__container', {
					'is-visible': isVisible,
				} ) }
			>
				<Fill name="Popover">
					<div
						className="wp-block-legacy-widget__edit-form is-wide"
						ref={ dialogRef }
						{ ...dialogProps }
						hidden={ ! isVisible }
					>
						<header className="wp-block-legacy-widget__edit-form-header">
							<h3 className="wp-block-legacy-widget__edit-form-title">
								{ title }
							</h3>
							<Button
								icon={ closeSmall }
								label={ __( 'Close dialog' ) }
								onClick={ onClose }
							/>
						</header>
						<div
							className="wp-block-legacy-widget__edit-form-body"
							ref={ ref }
						/>
					</div>
				</Fill>
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
