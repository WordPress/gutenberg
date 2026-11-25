import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import type { PostWithPassword } from './types';
import PostPasswordModal from './post-password-modal';
import styles from './style.module.css';

/*
 * The password control, laid out with `Stack` and `Button` of
 * `@wordpress/ui` and `@wordpress/components`, opening a modal to set or edit the password.
 */
export default function PasswordEdit( {
	data,
	onChange,
	field,
}: {
	data: PostWithPassword;
	onChange: ( value: Partial< PostWithPassword > ) => void;
	field: {
		getValue: ( args: { item: PostWithPassword } ) => string | undefined;
	};
} ) {
	const password = field.getValue( { item: data } ) || '';
	const [ isPasswordModalOpen, setIsPasswordModalOpen ] = useState( false );
	const buttonRef = useRef< HTMLButtonElement >( null );
	const triggerRef = useRef< HTMLButtonElement | null >( null );

	const closeParentDropdown = () => {
		const popover = buttonRef.current?.closest< HTMLElement >(
			'.components-popover'
		);
		const closeButton = popover?.querySelector< HTMLButtonElement >(
			'.dataforms-layouts-panel__dropdown-header button, button[aria-label="Close"]'
		);
		closeButton?.click();
	};

	// Hide the parent popover while the modal is open so it does not cover or show behind the modal.
	useEffect( () => {
		if ( ! isPasswordModalOpen ) {
			return;
		}

		const popover = buttonRef.current?.closest< HTMLElement >(
			'.components-popover'
		);
		if ( ! popover ) {
			return;
		}

		const originalVisibility = popover.style.visibility;
		popover.style.visibility = 'hidden';

		return () => {
			popover.style.visibility = originalVisibility;
		};
	}, [ isPasswordModalOpen ] );

	// Restore focus to the parent dropdown toggle (e.g. "Edit Status") if the dropdown was closed.
	useEffect( () => {
		if ( ! isPasswordModalOpen && triggerRef.current ) {
			const trigger = triggerRef.current;
			triggerRef.current = null;
			if (
				! buttonRef.current ||
				! document.contains( buttonRef.current )
			) {
				trigger.focus();
			}
		}
	}, [ isPasswordModalOpen ] );

	const passwordHelpId = useInstanceId(
		PasswordEdit,
		'fields-controls__password-help'
	);

	return (
		<Stack
			direction="column"
			gap="xs"
			// The editors style the control by this class name.
			className={ clsx( 'fields-controls__password', styles.password ) }
		>
			<Button
				ref={ buttonRef }
				__next40pxDefaultSize
				variant="secondary"
				aria-describedby={ String( passwordHelpId ) }
				onClick={ () => {
					const popover = buttonRef.current?.closest(
						'.components-popover'
					);
					if ( popover ) {
						triggerRef.current =
							document.querySelector< HTMLButtonElement >(
								'.dataforms-layouts-panel__field-dropdown-anchor button[aria-expanded="true"], .components-dropdown button[aria-expanded="true"]'
							);
					}
					setIsPasswordModalOpen( true );
				} }
			>
				{ password ? __( 'Edit password' ) : __( 'Set password' ) }
			</Button>
			<p id={ String( passwordHelpId ) } className={ styles.help }>
				{ __( 'Only visible to those who know the password.' ) }
			</p>
			{ isPasswordModalOpen && (
				<PostPasswordModal
					initialPassword={ password }
					onSave={ ( newPassword ) => {
						onChange( { password: newPassword } );
						closeParentDropdown();
						setIsPasswordModalOpen( false );
					} }
					onRemove={ () => {
						onChange( { password: '' } );
						closeParentDropdown();
						setIsPasswordModalOpen( false );
					} }
					onClose={ () => {
						closeParentDropdown();
						setIsPasswordModalOpen( false );
					} }
				/>
			) }
		</Stack>
	);
}
