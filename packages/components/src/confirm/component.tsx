/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useState } from 'react';
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

// @todo add type declarations for the react-confirm functions
function Confirm(
	props: WordPressComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const { message, onConfirm, onCancel, ...otherProps } = useContextSystem(
		props,
		'Confirm'
	);

	const [ isOpen, setIsOpen ] = useState( true );

	const closeAndHandle = (
		callback: ( event: MouseEvent< HTMLButtonElement > ) => void
	) => ( event: MouseEvent< HTMLButtonElement > ) => {
		setIsOpen( false );
		callback( event );
	};

	return (
		<>
			{ isOpen && (
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
