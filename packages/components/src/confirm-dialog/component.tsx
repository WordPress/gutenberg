/**
 * External dependencies
 */
import type { Ref, KeyboardEvent } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Modal from '../modal';
import type { OwnProps, DialogInputEvent } from './types';
import {
	useContextSystem,
	contextConnect,
	WordPressComponentProps,
} from '../ui/context';
import { Flex } from '../flex';
import Button from '../button';
import { Text } from '../text';
import { VStack } from '../v-stack';

function ConfirmDialog(
	props: WordPressComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		isOpen: isOpenProp,
		onConfirm,
		onCancel,
		children,
		...otherProps
	} = useContextSystem( props, 'ConfirmDialog' );

	const [ isOpen, setIsOpen ] = useState< boolean >();
	const [ shouldSelfClose, setShouldSelfClose ] = useState< boolean >();

	useEffect( () => {
		// We only allow the dialog to close itself if `isOpenProp` is *not* set.
		// If `isOpenProp` is set, then it (probably) means it's controlled by a
		// parent component. In that case, `shouldSelfClose` might do more harm than
		// good, so we disable it.
		const isIsOpenSet = typeof isOpenProp !== 'undefined';
		setIsOpen( isIsOpenSet ? isOpenProp : true );
		setShouldSelfClose( ! isIsOpenSet );
	}, [ isOpenProp ] );

	const handleEvent = useCallback(
		( callback?: ( event: DialogInputEvent ) => void ) => (
			event: DialogInputEvent
		) => {
			callback?.( event );
			if ( shouldSelfClose ) {
				setIsOpen( false );
			}
		},
		[ shouldSelfClose, setIsOpen ]
	);

	const handleEnter = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key === 'Enter' ) {
				handleEvent( onConfirm )( event );
			}
		},
		[ handleEvent, onConfirm ]
	);

	const cancelLabel = __( 'Cancel' );
	const confirmLabel = __( 'OK' );

	return (
		<>
			{ isOpen && (
				<Modal
					onRequestClose={ handleEvent( onCancel ) }
					onKeyDown={ handleEnter }
					closeButtonLabel={ cancelLabel }
					isDismissible={ true }
					ref={ forwardedRef }
					__experimentalHideHeader
					{ ...otherProps }
				>
					<VStack spacing={ 8 }>
						<Text>{ children }</Text>
						<Flex direction="row" justify="flex-end">
							<Button
								variant="tertiary"
								onClick={ handleEvent( onCancel ) }
							>
								{ cancelLabel }
							</Button>
							<Button
								variant="primary"
								onClick={ handleEvent( onConfirm ) }
							>
								{ confirmLabel }
							</Button>
						</Flex>
					</VStack>
				</Modal>
			) }
		</>
	);
}

export default contextConnect( ConfirmDialog, 'ConfirmDialog' );
