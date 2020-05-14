/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, Panel, PanelBody, TextControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const menuNameMatches = ( menuName ) => ( menu ) =>
	menu.name.toLowerCase() === menuName.toLowerCase();

export default function CreateMenuForm( { onCancel, menus } ) {
	const [ menuName, setMenuName ] = useState( '' );
	const [ validationError, setValidationError ] = useState( '' );
	const { saveMenu } = useDispatch( 'core' );

	const onChangeMenuName = ( menuNameValue ) => {
		// Clear validation errors when typing.
		if ( validationError !== '' ) {
			setValidationError( '' );
		}

		setMenuName( menuNameValue );
	};

	const onCreateMenu = useCallback(
		( event ) => {
			// Prevent form submission.
			event.preventDefault();

			if ( menuName.length === 0 ) {
				// Button is aria-disabled, do nothing.
				return;
			}

			// Validate the menu name doesn't match an existing menu.
			if ( some( menus, menuNameMatches( menuName ) ) ) {
				setValidationError(
					sprintf(
						// translators: %s: the name of a menu.
						__(
							'The menu name %s conflicts with another menu name. Please try another.'
						),
						menuName
					)
				);
				return;
			}

			saveMenu( { name: menuName } );
		},
		[ menuName, menus ]
	);

	return (
		<Panel className="edit-navigation-menus-editor__create-menu-panel">
			<PanelBody title={ __( 'Create navigation menu' ) }>
				<form onSubmit={ onCreateMenu }>
					<TextControl
						label={ __( 'Menu name' ) }
						value={ menuName }
						onChange={ onChangeMenuName }
						placeholder={ __( 'Main Navigation' ) }
					/>
					<Button
						type="submit"
						isPrimary
						onClick={ onCreateMenu }
						aria-disabled={ menuName.length === 0 }
					>
						{ __( 'Create menu' ) }
					</Button>
					{ onCancel && (
						<Button
							className="edit-navigation-menu-editor__cancel-create-menu-button"
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
