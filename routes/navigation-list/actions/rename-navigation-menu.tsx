import { useMemo, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import type { Post } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';
import type { Action } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { Collapsible, InputControl, Notice, Stack } from '@wordpress/ui';
import {
	NAVIGATION_POST_TYPE,
	PRELOADED_NAVIGATION_MENUS_QUERY,
} from '../constants';

const notEmptyString = ( testString?: string ) =>
	( testString?.trim()?.length ?? 0 ) > 0;

function getMenuTitle( item: Post ) {
	const title = item.title;
	if ( typeof title === 'string' ) {
		return title;
	}
	return title?.rendered ?? '';
}

export function RenameNavigationMenuModal( {
	items,
	closeModal,
	onActionPerformed,
}: {
	items: Post[];
	closeModal?: () => void;
	onActionPerformed?: ( items: Post[] ) => void;
} ) {
	const [ item ] = items;
	const menuTitle = getMenuTitle( item );
	const initialMenuSlug = item.slug ?? '';

	const [ editedMenuTitle, setEditedMenuTitle ] = useState( menuTitle );
	const [ editedMenuSlug, setEditedMenuSlug ] = useState( initialMenuSlug );

	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice, createWarningNotice } =
		useDispatch( noticesStore );

	const normalizedEditedMenuSlug = cleanForSlug( editedMenuSlug );
	const titleHasChanged = editedMenuTitle !== menuTitle;

	// Compared as it was typed rather than as it normalizes, so that a slug
	// nobody edited is never submitted. `cleanForSlug()` only approximates
	// `sanitize_title()`, so it cannot be trusted to leave a stored slug be.
	const slugHasChanged = editedMenuSlug !== initialMenuSlug;

	// Navigation blocks reference menus by slug, so a duplicate would silently
	// repoint them. This only sees the loaded menus, so it is an early warning:
	// `wp_insert_post_data` is what enforces uniqueness, and the save below
	// reports the slug it ended up storing.
	const { records: navigationMenus } = useEntityRecords< Post >(
		'postType',
		NAVIGATION_POST_TYPE,
		PRELOADED_NAVIGATION_MENUS_QUERY
	);

	const hasSlugConflict =
		slugHasChanged &&
		!! navigationMenus?.some(
			( menu ) =>
				menu.id !== item.id && menu.slug === normalizedEditedMenuSlug
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

	async function onRename( event: React.FormEvent ) {
		event.preventDefault();

		if ( ! canSave ) {
			return;
		}

		const edits = {
			...( isEditedMenuTitleValid ? { title: editedMenuTitle } : {} ),
			...( slugHasChanged ? { slug: normalizedEditedMenuSlug } : {} ),
		};

		try {
			await editEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				item.id,
				edits
			);
			// Update state before saving rerenders the list.
			closeModal?.();
			const savedRecord = ( await saveEditedEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				item.id,
				{ throwOnError: true }
			) ) as Post | undefined;

			// A slug already taken by another menu is suffixed on the server,
			// which would leave blocks referencing the requested slug pointing
			// at nothing. Say so rather than reporting a plain success.
			if (
				edits.slug &&
				savedRecord &&
				savedRecord.slug !== edits.slug
			) {
				createWarningNotice(
					sprintf(
						/* translators: %s: Navigation Menu slug that was stored instead of the requested one. */
						__(
							'That slug was already in use, so this Navigation Menu was saved as "%s".'
						),
						savedRecord.slug
					),
					{ type: 'snackbar' }
				);
			} else {
				createSuccessNotice( __( 'Name updated' ), {
					type: 'snackbar',
				} );
			}
			onActionPerformed?.( items );
		} catch ( error ) {
			const typedError = error as { message?: string; code?: string };
			const errorMessage =
				typedError.message && typedError.code !== 'unknown_error'
					? typedError.message
					: __( 'An error occurred while updating the name' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<form onSubmit={ onRename }>
			<Stack direction="column" gap="lg">
				<InputControl
					label={ __( 'Name' ) }
					value={ editedMenuTitle }
					onValueChange={ setEditedMenuTitle }
					required
				/>
				<Collapsible.Root>
					<Collapsible.Trigger
						render={ <Button variant="tertiary" size="compact" /> }
					>
						{ __( 'Advanced' ) }
					</Collapsible.Trigger>
					<Collapsible.Panel>
						<Stack direction="column" gap="md">
							<InputControl
								label={ __( 'Slug' ) }
								value={ editedMenuSlug }
								onValueChange={ setEditedMenuSlug }
								description={ __(
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
						</Stack>
					</Collapsible.Panel>
				</Collapsible.Root>
				<Stack justify="right" gap="sm">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => {
							closeModal?.();
						} }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						disabled={ ! canSave }
						variant="primary"
						type="submit"
					>
						{ __( 'Save' ) }
					</Button>
				</Stack>
			</Stack>
		</form>
	);
}

/**
 * The "Rename" action for Navigation Menus.
 *
 * Replaces the generic `rename-post` action on the Navigation screens, which
 * edits the name only. A Navigation Menu's slug is what Navigation blocks
 * reference portably, so it is editable here too, next to the warning that
 * changing it disconnects the blocks referencing the old slug.
 *
 * @return The action.
 */
export function useRenameNavigationMenuAction(): Action< Post > {
	return useMemo(
		() => ( {
			id: 'rename-navigation-menu',
			label: __( 'Rename' ),
			modalHeader: __( 'Rename' ),
			modalFocusOnMount: 'firstContentElement',
			isEligible( item: Post ) {
				return (
					item.type === NAVIGATION_POST_TYPE &&
					String( item.status ) !== 'trash' &&
					!! (
						item as Post & {
							permissions?: { update?: boolean };
						}
					 ).permissions?.update
				);
			},
			RenderModal: RenameNavigationMenuModal,
		} ),
		[]
	);
}
