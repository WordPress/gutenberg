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
import Button from '../button';
import Modal from '../modal';
import type { OwnProps } from './types';
import {
	useContextSystem,
	contextConnect,
	PolymorphicComponentProps,
} from '../ui/context';
import { Flex } from '../flex';

// @todo add type declarations for the react-confirm functions
function Confirm(
	props: PolymorphicComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		message,
		onConfirm,
		onCancel,
		role,
		...otherProps
	} = useContextSystem( props, 'Confirm' );

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
				<Modal
					title={ message }
					onRequestClose={ closeAndHandle( onCancel ) }
					{ ...otherProps }
					ref={ forwardedRef }
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
			) }
		</>
	);
}

export default contextConnect( Confirm, 'Confirm' );
