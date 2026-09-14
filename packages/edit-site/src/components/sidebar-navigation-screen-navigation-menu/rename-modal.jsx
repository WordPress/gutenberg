import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { cleanForSlug } from '@wordpress/url';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from '../sidebar-navigation-screen-navigation-menus/constants';

const notEmptyString = ( testString ) => testString?.trim()?.length > 0;

export default function RenameModal( {
	menuId,
	menuTitle,
	menuSlug,
	onClose,
	onSave,
} ) {
	const [ editedMenuTitle, setEditedMenuTitle ] = useState( menuTitle );
	const [ editedMenuSlug, setEditedMenuSlug ] = useState( menuSlug ?? '' );

	const normalizedEditedMenuSlug = cleanForSlug( editedMenuSlug );
	const titleHasChanged = editedMenuTitle !== menuTitle;
	const slugHasChanged = normalizedEditedMenuSlug !== menuSlug;

	// Navigation blocks reference menus by slug, so a duplicate would silently
	// repoint them. This is an early warning only; `wp_insert_post_data`
	// enforces uniqueness on the server.
	const { records: navigationMenus } = useEntityRecords(
		'postType',
		NAVIGATION_POST_TYPE,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const hasSlugConflict =
		slugHasChanged &&
		!! navigationMenus?.some(
			( menu ) =>
				menu.id !== menuId && menu.slug === normalizedEditedMenuSlug
		);

	const isEditedMenuTitleValid =
		titleHasChanged && notEmptyString( editedMenuTitle );
	const isEditedMenuSlugValid =
		! slugHasChanged ||
		( notEmptyString( normalizedEditedMenuSlug ) && ! hasSlugConflict );
	const canSave =
		( isEditedMenuTitleValid || slugHasChanged ) && isEditedMenuSlugValid;

	return (
		<Modal
			title={ __( 'Rename' ) }
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form className="sidebar-navigation__rename-modal-form">
				<VStack spacing="3">
					<TextControl
						value={ editedMenuTitle }
						placeholder={ __( 'Navigation title' ) }
						onChange={ setEditedMenuTitle }
						label={ __( 'Name' ) }
					/>
					<details>
						<summary>{ __( 'Advanced' ) }</summary>
						<VStack spacing="3">
							<TextControl
								value={ editedMenuSlug }
								onChange={ setEditedMenuSlug }
								label={ __( 'Slug' ) }
								help={ __(
									'Use lowercase letters, numbers, and hyphens. Slugs must be unique.'
								) }
							/>
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Changing this slug may disconnect blocks, templates, or patterns that reference the old slug.'
								) }
							</Notice>
							{ slugHasChanged && ! normalizedEditedMenuSlug && (
								<Notice status="error" isDismissible={ false }>
									{ __( 'Enter a valid slug.' ) }
								</Notice>
							) }
							{ hasSlugConflict && (
								<Notice status="error" isDismissible={ false }>
									{ __(
										'This slug is already used by another Navigation Menu.'
									) }
								</Notice>
							) }
						</VStack>
					</details>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onClose }
						>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							__next40pxDefaultSize
							accessibleWhenDisabled
							disabled={ ! canSave }
							variant="primary"
							type="submit"
							onClick={ ( e ) => {
								e.preventDefault();

								if ( ! canSave ) {
									return;
								}

								onSave( {
									...( isEditedMenuTitleValid
										? { title: editedMenuTitle }
										: {} ),
									...( slugHasChanged
										? { slug: normalizedEditedMenuSlug }
										: {} ),
								} );

								// Immediate close avoids ability to hit save multiple times.
								onClose();
							} }
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
