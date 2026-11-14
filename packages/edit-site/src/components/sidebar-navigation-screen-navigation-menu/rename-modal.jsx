import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
} from '@wordpress/components';
import { Notice } from '@wordpress/ui';
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
	const initialMenuSlug = menuSlug ?? '';
	const [ editedMenuTitle, setEditedMenuTitle ] = useState( menuTitle );
	const [ editedMenuSlug, setEditedMenuSlug ] = useState( initialMenuSlug );

	const normalizedEditedMenuSlug = cleanForSlug( editedMenuSlug );
	const titleHasChanged = editedMenuTitle !== menuTitle;

	// Compared as it was typed rather than as it normalizes, so that a slug
	// nobody edited is never submitted. `cleanForSlug()` only approximates
	// `sanitize_title()`, so it cannot be trusted to leave a stored slug be.
	const slugHasChanged = editedMenuSlug !== initialMenuSlug;

	// Navigation blocks reference menus by slug, so a duplicate would silently
	// repoint them. This only sees the loaded menus, so it is an early warning:
	// `wp_insert_post_data` is what enforces uniqueness, and `onSave` reports
	// the slug it ended up storing.
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

	// An emptied name is never saved, so it cannot be left behind by a slug
	// that can: it has to be put back, or the modal cancelled.
	const canSave =
		( isEditedMenuTitleValid || slugHasChanged ) &&
		isEditedMenuSlugValid &&
		( ! titleHasChanged || isEditedMenuTitleValid );

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
							<Notice.Root intent="warning">
								<Notice.Description>
									{ __(
										'Changing this slug may disconnect blocks, templates, or patterns that reference the old slug.'
									) }
								</Notice.Description>
							</Notice.Root>
							<Notice.List>
								{ slugHasChanged &&
									! normalizedEditedMenuSlug && (
										<Notice.Root intent="error">
											<Notice.Description>
												{ __( 'Enter a valid slug.' ) }
											</Notice.Description>
										</Notice.Root>
									) }
								{ hasSlugConflict && (
									<Notice.Root intent="error">
										<Notice.Description>
											{ __(
												'This slug is already used by another Navigation Menu.'
											) }
										</Notice.Description>
									</Notice.Root>
								) }
							</Notice.List>
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
