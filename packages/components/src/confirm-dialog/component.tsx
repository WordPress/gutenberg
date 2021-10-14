/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import type { Ref, KeyboardEvent } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';

function ConfirmDialog(
	props: WordPressComponentProps< OwnProps, 'div', false >,
	forwardedRef: Ref< any >
) {
	const {
		isOpen: isOpenProp,
		title,
		onConfirm,
		onCancel,
		children,
		...otherProps
	} = useContextSystem( props, 'ConfirmDialog' );

	const hasTitle = !! title;
	const cx = useCx();
	const wrapperClassNames = cx(
		styles.wrapper,
		! hasTitle && styles.withoutTitle
	);
	const stackedMarginWrapperClassName = cx( styles.stackedMarginWrapper );

	const [ isOpen, setIsOpen ] = useState< boolean >();
	const [ selfClose, setSelfClose ] = useState< boolean >();

	useEffect( () => {
		// We only allow the dialog to close itself if `isOpenProp` is *not* set.
		// If `isOpenProp` is set, then it (probably) means it's controlled by a
		// parent component. In that case, `selfClose` might do more harm than
		// good, so we disable it.
		const isIsOpenSet = typeof isOpenProp !== 'undefined';
		setIsOpen( isIsOpenSet ? isOpenProp : true );
		setSelfClose( ! isIsOpenSet );
	}, [ isOpenProp ] );

	const handleEvent = ( callback?: ( event: DialogInputEvent ) => void ) => (
		event: DialogInputEvent
	) => {
		// `onCancel` is optional
		callback?.( event );
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
			{ isOpen && (
				<Modal
					title={ title }
					overlayClassName={ wrapperClassNames }
					onRequestClose={ handleEvent( onCancel ) }
					onKeyDown={ handleEnter }
					closeButtonLabel={ __( 'Cancel' ) }
					isDismissible={ true }
					ref={ forwardedRef }
					{ ...otherProps }
				>
					<div className={ stackedMarginWrapperClassName }>
						<p>{ children }</p>
						<Flex direction="row" justify="flex-end">
							<Button
								variant="tertiary"
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
					</div>
				</Modal>
			) }
		</>
	);
}

export default contextConnect( ConfirmDialog, 'ConfirmDialog' );
