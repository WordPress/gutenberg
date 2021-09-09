/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useEffect, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import type { Ref, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Modal from '../modal';
import type { OwnProps } from './types';
import {
	useContextSystem,
	contextConnect,
	WordPressComponentProps,
} from '../ui/context';
import { View } from '../view';
import { Flex } from '../flex';
import Button from '../button';

function Confirm(
	props: WordPressComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		isOpen,
		message,
		onConfirm,
		onCancel,
		...otherProps
	} = useContextSystem( props, 'Confirm' );

	const [ _isOpen, setIsOpen ] = useState( false );

	useEffect( () => {
		setIsOpen( isOpen || false );
	}, [ isOpen ] );

	const closeAndHandle = (
		callback: ( event: MouseEvent< HTMLButtonElement > ) => void
	) => ( event: MouseEvent< HTMLButtonElement > ) => {
		if ( typeof callback === 'function' ) {
			callback( event );
		} else {
			// standalone/uncontrolled usage
			setIsOpen( false );
		}
	};

	return (
		<>
			{ _isOpen && (
				<View ref={ forwardedRef } { ...otherProps }>
					<Modal
						title={ message }
						onRequestClose={ closeAndHandle( onCancel ) }
						onKeyDown={ closeAndHandle( onCancel ) }
						className="edit-post-keyboard-shortcut-help-modal"
						closeButtonLabel={ __( 'Cancel' ) }
						isDismissible={ false } // This should probably be renamed to `showCancelButton` in Modal? Food for thought.
					>
						<Flex justify="flex-end">
							<Button
								variant="secondary"
								onClick={ closeAndHandle( onCancel ) }
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ closeAndHandle( onConfirm ) }
							>
								{ __( 'OK' ) }
							</Button>
						</Flex>
					</Modal>
				</View>
			) }
		</>
	);
}

export default contextConnect( Confirm, 'Confirm' );
