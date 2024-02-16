/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Modal from '../modal';
import type { ConfirmDialogProps, DialogInputEvent } from './types';
import type { WordPressComponentProps } from '../context';
import { useContextSystem, contextConnect } from '../context';
import { Flex } from '../flex';
import Button from '../button';
import { Text } from '../text';
import { VStack } from '../v-stack';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';

const UnconnectedConfirmDialog = (
	props: WordPressComponentProps< ConfirmDialogProps, 'div', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		isOpen: isOpenProp,
		onConfirm,
		onCancel,
		children,
		confirmButtonText,
		cancelButtonText,
		...otherProps
	} = useContextSystem( props, 'ConfirmDialog' );

	const cx = useCx();
	const wrapperClassName = cx( styles.wrapper );
	const cancelButtonRef = useRef();
	const confirmButtonRef = useRef();

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
		( callback?: ( event: DialogInputEvent ) => void ) =>
			( event: DialogInputEvent ) => {
				callback?.( event );
				if ( shouldSelfClose ) {
					setIsOpen( false );
				}
			},
		[ shouldSelfClose, setIsOpen ]
	);

	const handleEnter = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			// Avoid triggering the 'confirm' action when a button is focused,
			// as this can cause a double submission.
			const isConfirmOrCancelButton =
				event.target === cancelButtonRef.current ||
				event.target === confirmButtonRef.current;

			if ( ! isConfirmOrCancelButton && event.key === 'Enter' ) {
				handleEvent( onConfirm )( event );
			}
		},
		[ handleEvent, onConfirm ]
	);

	const cancelLabel = cancelButtonText ?? __( 'Cancel' );
	const confirmLabel = confirmButtonText ?? __( 'OK' );

	return (
		<>
			{ isOpen && (
				<Modal
					onRequestClose={ handleEvent( onCancel ) }
					onKeyDown={ handleEnter }
					closeButtonLabel={ cancelLabel }
					isDismissible={ true }
					ref={ forwardedRef }
					overlayClassName={ wrapperClassName }
					__experimentalHideHeader
					{ ...otherProps }
				>
					<VStack spacing={ 8 }>
						<Text>{ children }</Text>
						<Flex direction="row" justify="flex-end">
							<Button
								__next40pxDefaultSize
								ref={ cancelButtonRef }
								variant="tertiary"
								onClick={ handleEvent( onCancel ) }
							>
								{ cancelLabel }
							</Button>
							<Button
								__next40pxDefaultSize
								ref={ confirmButtonRef }
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
};

/**
 * `ConfirmDialog` is built of top of [`Modal`](/packages/components/src/modal/README.md)
 * and displays a confirmation dialog, with _confirm_ and _cancel_ buttons.
 * The dialog is confirmed by clicking the _confirm_ button or by pressing the `Enter` key.
 * It is cancelled (closed) by clicking the _cancel_ button, by pressing the `ESC` key, or by
 * clicking outside the dialog focus (i.e, the overlay).
 *
 * `ConfirmDialog` has two main implicit modes: controlled and uncontrolled.
 *
 * UnControlled:
 *
 * Allows the component to be used standalone, just by declaring it as part of another React's component render method:
 * -   It will be automatically open (displayed) upon mounting;
 * -   It will be automatically closed when clicking the _cancel_ button, by pressing the `ESC` key, or by clicking outside the dialog focus (i.e, the overlay);
 * -   `onCancel` is not mandatory but can be passed. Even if passed, the dialog will still be able to close itself.
 *
 * Activating this mode is as simple as omitting the `isOpen` prop. The only mandatory prop, in this case, is the `onConfirm` callback. The message is passed as the `children`. You can pass any JSX you'd like, which allows to further format the message or include sub-component if you'd like:
 *
 * ```jsx
 * import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<ConfirmDialog onConfirm={ () => console.debug( ' Confirmed! ' ) }>
 * 			Are you sure? <strong>This action cannot be undone!</strong>
 * 		</ConfirmDialog>
 * 	);
 * }
 * ```
 *
 *
 * Controlled mode:
 *  Let the parent component control when the dialog is open/closed. It's activated when a
 * boolean value is passed to `isOpen`:
 * -   It will not be automatically closed. You need to let it know when to open/close by updating the value of the `isOpen` prop;
 * -   Both `onConfirm` and the `onCancel` callbacks are mandatory props in this mode;
 * -   You'll want to update the state that controls `isOpen` by updating it from the `onCancel` and `onConfirm` callbacks.
 *
 *```jsx
 * import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * function Example() {
 * 	const [ isOpen, setIsOpen ] = useState( true );
 *
 * 	const handleConfirm = () => {
 * 		console.debug( 'Confirmed!' );
 * 		setIsOpen( false );
 * 	};
 *
 * 	const handleCancel = () => {
 * 		console.debug( 'Cancelled!' );
 * 		setIsOpen( false );
 * 	};
 *
 * 	return (
 * 		<ConfirmDialog
 * 			isOpen={ isOpen }
 * 			onConfirm={ handleConfirm }
 * 			onCancel={ handleCancel }
 * 		>
 * 			Are you sure? <strong>This action cannot be undone!</strong>
 * 		</ConfirmDialog>
 * 	);
 * }
 * ```
 */
export const ConfirmDialog = contextConnect(
	UnconnectedConfirmDialog,
	'ConfirmDialog'
);
export default ConfirmDialog;
