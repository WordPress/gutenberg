/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	TextControl,
	withFocusReturn,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
const { DOMParser } = window;

const noticeId = 'edit-navigation-create-menu-error';

const menuNameMatches = ( menuName ) => ( menu ) =>
	menu.name.toLowerCase() === menuName.toLowerCase();

export function CreateMenuArea( { onCancel, onCreateMenu, menus } ) {
	const [ menuName, setMenuName ] = useState( '' );
	const [ isCreatingMenu, setIsCreatingMenu ] = useState( false );
	const menuSaveError = useSelect( ( select ) =>
		select( 'core' ).getLastEntitySaveError( 'root', 'menu' )
	);
	const { saveMenu } = useDispatch( 'core' );
	const { createInfoNotice, createErrorNotice, removeNotice } = useDispatch(
		'core/notices'
	);

	// Handle REST API Error messages.
	useEffect( () => {
		if ( menuSaveError ) {
			// Error messages from the REST API often contain HTML.
			// createErrorNotice does not support HTML in error text, so first
			// strip HTML out using DOMParser.
			const document = new DOMParser().parseFromString(
				menuSaveError.message,
				'text/html'
			);
			const errorText = document.body.textContent || '';
			createErrorNotice( errorText, { id: noticeId } );
		}
	}, [ menuSaveError ] );

	const createMenu = useCallback(
		async ( event ) => {
			// Prevent form submission.
			event.preventDefault();

			// Remove existing notices.
			removeNotice( noticeId );

			if ( menuName.length === 0 ) {
				// Button is aria-disabled, do nothing.
				return;
			}

			// Validate the menu name doesn't match an existing menu.
			if ( some( menus, menuNameMatches( menuName ) ) ) {
				const message = sprintf(
					// translators: %s: the name of a menu.
					__(
						'The menu name %s conflicts with another menu name. Please try another.'
					),
					menuName
				);
				createErrorNotice( message, { id: noticeId } );
				return;
			}

			setIsCreatingMenu( true );

			const menu = await saveMenu( { name: menuName } );
			if ( menu ) {
				createInfoNotice( __( 'Menu created' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
				onCreateMenu( menu.id );
			}

			setIsCreatingMenu( false );
		},
		[ menuName, menus ]
	);

	return (
		<Card className="edit-navigation-menus-editor__create-menu-area">
			<CardHeader>{ __( 'Create navigation menu' ) }</CardHeader>
			<CardBody>
				<form onSubmit={ createMenu }>
					<TextControl
						// Disable reason - autoFocus is legitimate in this usage,
						// The first focusable on the form should be focused,
						// which is this element.
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus
						label={ __( 'Menu name' ) }
						value={ menuName }
						onChange={ setMenuName }
						placeholder={ __( 'Main Navigation' ) }
					/>
					<Button
						type="submit"
						isBusy={ isCreatingMenu }
						onClick={ createMenu }
						aria-disabled={ menuName.length === 0 }
						isPrimary
					>
						{ __( 'Create menu' ) }
					</Button>
					{ onCancel && (
						<Button
							className="edit-navigation-menus-editor__cancel-create-menu-button"
							isSecondary
							onClick={ onCancel }
						>
							{ __( 'Cancel' ) }
						</Button>
					) }
				</form>
			</CardBody>
		</Card>
	);
}

export default withFocusReturn( CreateMenuArea );
