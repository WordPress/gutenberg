/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Button,
	Panel,
	PanelBody,
	TextControl,
	withFocusReturn,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const noticeId = 'edit-navigation-create-menu-error';

const menuNameMatches = ( menuName ) => ( menu ) =>
	menu.name.toLowerCase() === menuName.toLowerCase();

export function CreateMenuForm( { onCancel, onCreateMenu, menus } ) {
	const [ menuName, setMenuName ] = useState( '' );
	const { isCreatingMenu, hasCreatedMenu } = useSelect( ( select ) => {
		const { getIsResolving, hasFinishedResolution } = select( 'core' );
		return {
			isCreatingMenu: getIsResolving( 'saveMenu' ),
			hasCreatedMenu: hasFinishedResolution( 'saveMenu' ),
		};
	}, [] );
	const { saveMenu } = useDispatch( 'core' );
	const { createInfoNotice, createErrorNotice, removeNotice } = useDispatch(
		'core/notices'
	);

	useEffect( () => {
		if ( hasCreatedMenu ) {
			createInfoNotice( __( 'Menu created' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		}
	}, [ hasCreatedMenu ] );

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

			const menu = await saveMenu( { name: menuName } );
			onCreateMenu( menu.id );
		},
		[ menuName, menus ]
	);

	return (
		<Panel className="edit-navigation-menus-editor__create-menu-panel">
			<PanelBody title={ __( 'Create navigation menu' ) }>
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
			</PanelBody>
		</Panel>
	);
}

export default withFocusReturn( CreateMenuForm );
