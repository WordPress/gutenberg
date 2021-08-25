//@ts-nocheck (while we're using react-confirm)

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { confirmable } from 'react-confirm';
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
		show: isOpen = true,
		proceed,
		role,
		message,
		...otherProps
	} = useContextSystem( props, 'Confirm' );

	return (
		<>
			{ isOpen && (
				<Modal
					title={ message }
					onRequestClose={ () => proceed( false ) }
					{ ...otherProps }
					ref={ forwardedRef }
				>
					<Flex justify="flex-end">
						<Button
							variant="secondary"
							onClick={ () => proceed( false ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ () => proceed( true ) }
						>
							{ __( 'OK' ) }
						</Button>
					</Flex>
				</Modal>
			) }
		</>
	);
}

export default confirmable( contextConnect( Confirm, 'Confirm' ) );
