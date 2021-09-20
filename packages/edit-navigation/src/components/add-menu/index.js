/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button, TextControl, withNotices } from '@wordpress/components';
import { useFocusOnMount } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { MENU_POST_TYPE, MENU_KIND } from '../../constants';
import { stripHTML } from '../../utils';

function AddMenu( {
	className,
	onCreate,
	titleText,
	helpText,
	focusInputOnMount = false,
	noticeUI,
	noticeOperations,
} ) {
	const inputRef = useFocusOnMount( focusInputOnMount );
	const [ menuName, setMenuName ] = useState( '' );
	const [ isCreatingMenu, setIsCreatingMenu ] = useState( false );
	const { createInfoNotice } = useDispatch( noticesStore );
	const { saveMenu } = useDispatch( coreStore );

	const { createErrorNotice, removeAllNotices } = noticeOperations;

	const lastSaveError = useSelect( ( select ) => {
		return select( coreStore ).getLastEntitySaveError(
			MENU_KIND,
			MENU_POST_TYPE
		);
	}, [] );

	useEffect( () => {
		if ( lastSaveError ) {
			createErrorNotice( stripHTML( lastSaveError?.message ) );
		}
	}, [ lastSaveError ] );

	const createMenu = async ( event ) => {
		event.preventDefault();

		if ( ! menuName.length ) {
			return;
		}

		// Remove any existing notices.
		removeAllNotices();
		setIsCreatingMenu( true );

		const menu = await saveMenu( { name: menuName } );

		setIsCreatingMenu( false );

		if ( menu ) {
			createInfoNotice( __( 'Menu created' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
			if ( onCreate ) {
				onCreate( menu.id );
			}
		}
	};

	return (
		<form
			className={ classnames( 'edit-navigation-add-menu', className ) }
			onSubmit={ createMenu }
		>
			{ noticeUI }
			{ titleText && (
				<h3 className="edit-navigation-add-menu__title">
					{ titleText }
				</h3>
			) }
			<TextControl
				ref={ inputRef }
				label={ __( 'Menu name' ) }
				value={ menuName }
				onChange={ setMenuName }
				help={ helpText }
			/>

			<Button
				className="edit-navigation-add-menu__create-menu-button"
				type="submit"
				variant="primary"
				disabled={ ! menuName.length }
				isBusy={ isCreatingMenu }
			>
				{ __( 'Create menu' ) }
			</Button>
		</form>
	);
}

export default withNotices( AddMenu );
