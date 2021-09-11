/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { useEffect, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import type { Ref, SyntheticEvent, KeyboardEvent } from 'react';

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
import { Flex } from '../flex';
import Button from '../button';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';

function Confirm(
	props: WordPressComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		isOpen = true,
		message,
		onConfirm,
		onCancel = () => {},
		selfClose = true,
	} = useContextSystem( props, 'Confirm' );

	const cx = useCx();
	const wrapperClassName = cx( styles.wrapper );

	const [ _isOpen, setIsOpen ] = useState< Boolean >();

	useEffect( () => {
		setIsOpen( isOpen );
	}, [ isOpen ] );

	// @todo improve type, should handle keyboard and mousevent
	const handleEvent = ( callback: ( event: SyntheticEvent ) => void ) => (
		event: SyntheticEvent
	) => {
		callback( event );
		if ( selfClose ) {
			setIsOpen( false );
		}
	};

	const handleEnter = ( event: KeyboardEvent< HTMLDivElement > ) => {
		if ( event.key === 'Enter' ) {
			handleEvent( onConfirm )( event );
		}
	};

	return (
		<>
			{ _isOpen && (
				<Modal
					title={ message }
					overlayClassName={ wrapperClassName }
					onRequestClose={ handleEvent( onCancel ) }
					onKeyDown={ handleEnter }
					closeButtonLabel={ __( 'Cancel' ) }
					isDismissible={ true }
					forwardedRef={ forwardedRef }
				>
					<Flex justify="flex-end">
						<Button
							variant="secondary"
							onClick={ handleEvent( onCancel ) }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ handleEvent( onConfirm ) }
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
