/**
 * WordPress dependencies
 */
import { external, trash, backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo, useState } from '@wordpress/element';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

import {
	Button,
	TextControl,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_ORIGINS,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
	PATTERN_POST_TYPE,
} from '../../store/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import isTemplateRevertable from '../../store/utils/is-template-revertable';
import { exportPatternAsJSONAction } from './export-pattern-action';

// Patterns.
const { PATTERN_TYPES } = unlock( patternsPrivateApis );

function getItemTitle( item ) {
	if ( typeof item.title === 'string' ) {
		return decodeEntities( item.title );
	}
	return decodeEntities( item.title?.rendered || '' );
}

const trashPostAction = {
	id: 'move-to-trash',
	label: __( 'Move to Trash' ),
	isPrimary: true,
	icon: trash,
	isEligible( item ) {
		return ! [ 'auto-draft', 'trash' ].includes( item.status );
	},
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( {
		items: posts,
		closeModal,
		onActionStart,
		onActionPerformed,
	} ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const { deleteEntityRecord } = useDispatch( coreStore );
		return (
			<VStack spacing="5">
				<Text>
					{ posts.length === 1
						? sprintf(
								// translators: %s: The page's title.
								__( 'Are you sure you want to delete "%s"?' ),
								getItemTitle( posts[ 0 ] )
						  )
						: sprintf(
								// translators: %d: The number of pages (2 or more).
								_n(
									'Are you sure you want to delete %d page?',
									'Are you sure you want to delete %d pages?',
									posts.length
								),
								posts.length
						  ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						__experimentalIsFocusable
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							if ( onActionStart ) {
								onActionStart( posts );
							}
							const promiseResult = await Promise.allSettled(
								posts.map( ( post ) => {
									return deleteEntityRecord(
										'postType',
										post.type,
										post.id,
										{},
										{ throwOnError: true }
									);
								} )
							);
							// If all the promises were fulfilled with success.
							if (
								promiseResult.every(
									( { status } ) => status === 'fulfilled'
								)
							) {
								let successMessage;
								if ( promiseResult.length === 1 ) {
									successMessage = sprintf(
										/* translators: The posts's title. */
										__( '"%s" moved to the Trash.' ),
										getItemTitle( posts[ 0 ] )
									);
								} else if ( posts[ 0 ].type === 'page' ) {
									successMessage = sprintf(
										/* translators: The number of pages. */
										__( '%s pages moved to the Trash.' ),
										posts.length
									);
								} else {
									successMessage = sprintf(
										/* translators: The number of posts. */
										__( '%s posts moved to the Trash.' ),
										posts.length
									);
								}
								createSuccessNotice( successMessage, {
									type: 'snackbar',
									id: 'trash-post-action',
								} );
							} else {
								// If there was at lease one failure.
								let errorMessage;
								// If we were trying to move a single post to the trash.
								if ( promiseResult.length === 1 ) {
									if ( promiseResult[ 0 ].reason?.message ) {
										errorMessage =
											promiseResult[ 0 ].reason.message;
									} else {
										errorMessage = __(
											'An error occurred while moving the post to the trash.'
										);
									}
									// If we were trying to move multiple posts to the trash
								} else {
									const errorMessages = new Set();
									const failedPromises = promiseResult.filter(
										( { status } ) => status === 'rejected'
									);
									for ( const failedPromise of failedPromises ) {
										if ( failedPromise.reason?.message ) {
											errorMessages.add(
												failedPromise.reason.message
											);
										}
									}
									if ( errorMessages.size === 0 ) {
										errorMessage = __(
											'An error occurred while moving the posts to the trash.'
										);
									} else if ( errorMessages.size === 1 ) {
										errorMessage = sprintf(
											/* translators: %s: an error message */
											__(
												'An error occurred while moving the posts to the trash: %s'
											),
											[ ...errorMessages ][ 0 ]
										);
									} else {
										errorMessage = sprintf(
											/* translators: %s: a list of comma separated error messages */
											__(
												'Some errors occurred while moving the pages to the trash: %s'
											),
											[ ...errorMessages ].join( ',' )
										);
									}
								}
								createErrorNotice( errorMessage, {
									type: 'snackbar',
								} );
							}
							if ( onActionPerformed ) {
								onActionPerformed( posts );
							}
							setIsBusy( false );
							closeModal();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						__experimentalIsFocusable
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

function usePermanentlyDeletePostAction() {
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { deleteEntityRecord } = useDispatch( coreStore );

	return useMemo(
		() => ( {
			id: 'permanently-delete',
			label: __( 'Permanently delete' ),
			supportsBulk: true,
			isEligible( { status } ) {
				return status === 'trash';
			},
			async callback( posts, onActionPerformed ) {
				const promiseResult = await Promise.allSettled(
					posts.map( ( post ) => {
						return deleteEntityRecord(
							'postType',
							post.type,
							post.id,
							{ force: true },
							{ throwOnError: true }
						);
					} )
				);
				// If all the promises were fulfilled with success.
				if (
					promiseResult.every(
						( { status } ) => status === 'fulfilled'
					)
				) {
					let successMessage;
					if ( promiseResult.length === 1 ) {
						successMessage = sprintf(
							/* translators: The posts's title. */
							__( '"%s" permanently deleted.' ),
							getItemTitle( posts[ 0 ] )
						);
					} else {
						successMessage = __(
							'The posts were permanently deleted.'
						);
					}
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'permanently-delete-post-action',
					} );
					if ( onActionPerformed ) {
						onActionPerformed( posts );
					}
				} else {
					// If there was at lease one failure.
					let errorMessage;
					// If we were trying to permanently delete a single post.
					if ( promiseResult.length === 1 ) {
						if ( promiseResult[ 0 ].reason?.message ) {
							errorMessage = promiseResult[ 0 ].reason.message;
						} else {
							errorMessage = __(
								'An error occurred while permanently deleting the post.'
							);
						}
						// If we were trying to permanently delete multiple posts
					} else {
						const errorMessages = new Set();
						const failedPromises = promiseResult.filter(
							( { status } ) => status === 'rejected'
						);
						for ( const failedPromise of failedPromises ) {
							if ( failedPromise.reason?.message ) {
								errorMessages.add(
									failedPromise.reason.message
								);
							}
						}
						if ( errorMessages.size === 0 ) {
							errorMessage = __(
								'An error occurred while permanently deleting the posts.'
							);
						} else if ( errorMessages.size === 1 ) {
							errorMessage = sprintf(
								/* translators: %s: an error message */
								__(
									'An error occurred while permanently deleting the posts: %s'
								),
								[ ...errorMessages ][ 0 ]
							);
						} else {
							errorMessage = sprintf(
								/* translators: %s: a list of comma separated error messages */
								__(
									'Some errors occurred while permanently deleting the posts: %s'
								),
								[ ...errorMessages ].join( ',' )
							);
						}
					}
					createErrorNotice( errorMessage, {
						type: 'snackbar',
					} );
				}
			},
		} ),
		[ createSuccessNotice, createErrorNotice, deleteEntityRecord ]
	);
}

function useRestorePostAction() {
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );

	return useMemo(
		() => ( {
			id: 'restore',
			label: __( 'Restore' ),
			isPrimary: true,
			icon: backup,
			supportsBulk: true,
			isEligible( { status } ) {
				return status === 'trash';
			},
			async callback( posts, onActionPerformed ) {
				await Promise.allSettled(
					posts.map( ( post ) => {
						return editEntityRecord(
							'postType',
							post.type,
							post.id,
							{
								status: 'draft',
							}
						);
					} )
				);
				const promiseResult = await Promise.allSettled(
					posts.map( ( post ) => {
						return saveEditedEntityRecord(
							'postType',
							post.type,
							post.id,
							{ throwOnError: true }
						);
					} )
				);

				if (
					promiseResult.every(
						( { status } ) => status === 'fulfilled'
					)
				) {
					let successMessage;
					if ( posts.length === 1 ) {
						successMessage = sprintf(
							/* translators: The number of posts. */
							__( '"%s" has been restored.' ),
							getItemTitle( posts[ 0 ] )
						);
					} else if ( posts[ 0 ].type === 'page' ) {
						successMessage = sprintf(
							/* translators: The number of posts. */
							__( '%d pages have been restored.' ),
							posts.length
						);
					} else {
						successMessage = sprintf(
							/* translators: The number of posts. */
							__( '%d posts have been restored.' ),
							posts.length
						);
					}
					createSuccessNotice( successMessage, {
						type: 'snackbar',
						id: 'restore-post-action',
					} );
					if ( onActionPerformed ) {
						onActionPerformed( posts );
					}
				} else {
					// If there was at lease one failure.
					let errorMessage;
					// If we were trying to move a single post to the trash.
					if ( promiseResult.length === 1 ) {
						if ( promiseResult[ 0 ].reason?.message ) {
							errorMessage = promiseResult[ 0 ].reason.message;
						} else {
							errorMessage = __(
								'An error occurred while restoring the post.'
							);
						}
						// If we were trying to move multiple posts to the trash
					} else {
						const errorMessages = new Set();
						const failedPromises = promiseResult.filter(
							( { status } ) => status === 'rejected'
						);
						for ( const failedPromise of failedPromises ) {
							if ( failedPromise.reason?.message ) {
								errorMessages.add(
									failedPromise.reason.message
								);
							}
						}
						if ( errorMessages.size === 0 ) {
							errorMessage = __(
								'An error occurred while restoring the posts.'
							);
						} else if ( errorMessages.size === 1 ) {
							errorMessage = sprintf(
								/* translators: %s: an error message */
								__(
									'An error occurred while restoring the posts: %s'
								),
								[ ...errorMessages ][ 0 ]
							);
						} else {
							errorMessage = sprintf(
								/* translators: %s: a list of comma separated error messages */
								__(
									'Some errors occurred while restoring the posts: %s'
								),
								[ ...errorMessages ].join( ',' )
							);
						}
					}
					createErrorNotice( errorMessage, {
						type: 'snackbar',
					} );
				}
			},
		} ),
		[
			createSuccessNotice,
			createErrorNotice,
			editEntityRecord,
			saveEditedEntityRecord,
		]
	);
}

const viewPostAction = {
	id: 'view-post',
	label: __( 'View' ),
	isPrimary: true,
	icon: external,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, onActionPerformed ) {
		const post = posts[ 0 ];
		window.open( post.link, '_blank' );
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

const postRevisionsAction = {
	id: 'view-post-revisions',
	label: __( 'View revisions' ),
	isPrimary: false,
	isEligible: ( post ) => {
		if ( post.status === 'trash' ) {
			return false;
		}
		const lastRevisionId =
			post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
		const revisionsCount =
			post?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return lastRevisionId && revisionsCount > 1;
	},
	callback( posts, onActionPerformed ) {
		const post = posts[ 0 ];
		const href = addQueryArgs( 'revision.php', {
			revision: post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id,
		} );
		document.location.href = href;
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

const renamePostAction = {
	id: 'rename-post',
	label: __( 'Rename' ),
	isEligible( post ) {
		if ( post.status === 'trash' ) {
			return false;
		}
		// Templates, template parts and patterns have special checks for renaming.
		if (
			! [
				TEMPLATE_POST_TYPE,
				TEMPLATE_PART_POST_TYPE,
				...Object.values( PATTERN_TYPES ),
			].includes( post.type )
		) {
			return true;
		}
		// In the case of templates, we can only remove custom templates.
		if ( post.type === TEMPLATE_POST_TYPE ) {
			return isTemplateRemovable( post ) && post.is_custom;
		}
		// Make necessary checks for template parts and patterns.
		const isTemplatePart = post.type === TEMPLATE_PART_POST_TYPE;
		const isUserPattern = post.type === PATTERN_TYPES.user;
		// In patterns list page we map the templates parts to a different object
		// than the one returned from the endpoint. This is why we need to check for
		// two props whether is custom or has a theme file.
		const isCustomPattern =
			isUserPattern ||
			( isTemplatePart &&
				( post.isCustom || post.source === TEMPLATE_ORIGINS.custom ) );
		const hasThemeFile =
			isTemplatePart &&
			( post.templatePart?.has_theme_file || post.has_theme_file );
		return isCustomPattern && ! hasThemeFile;
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const originalTitle = decodeEntities(
			typeof item.title === 'string' ? item.title : item.title.rendered
		);
		const [ title, setTitle ] = useState( () => originalTitle );
		const { editEntityRecord, saveEditedEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onRename( event ) {
			event.preventDefault();
			try {
				await editEntityRecord( 'postType', item.type, item.id, {
					title,
				} );
				// Update state before saving rerenders the list.
				setTitle( '' );
				closeModal();
				// Persist edited entity.
				await saveEditedEntityRecord( 'postType', item.type, item.id, {
					throwOnError: true,
				} );
				createSuccessNotice( __( 'Name updated' ), {
					type: 'snackbar',
				} );
				onActionPerformed?.( items );
			} catch ( error ) {
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: __( 'An error occurred while updating the name' );
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}

		return (
			<form onSubmit={ onRename }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						required
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => {
								closeModal();
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

const duplicatePostAction = {
	id: 'duplicate-post',
	label: _x( 'Duplicate', 'action label' ),
	isEligible( { status } ) {
		return status !== 'trash';
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const [ isCreatingPage, setIsCreatingPage ] = useState( false );
		const [ title, setTitle ] = useState(
			sprintf(
				/* translators: %s: Existing item title */
				__( '%s (Copy)' ),
				getItemTitle( item )
			)
		);

		const { saveEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function createPage( event ) {
			event.preventDefault();

			if ( isCreatingPage ) {
				return;
			}
			setIsCreatingPage( true );
			try {
				const newItem = await saveEntityRecord(
					'postType',
					item.type,
					{
						status: 'draft',
						title,
						slug: title || __( 'No title' ),
						author: item.author,
						comment_status: item.comment_status,
						content:
							typeof item.content === 'string'
								? item.content
								: item.content.raw,
						excerpt: item.excerpt.raw,
						meta: item.meta,
						parent: item.parent,
						password: item.password,
						template: item.template,
						format: item.format,
						featured_media: item.featured_media,
						menu_order: item.menu_order,
						ping_status: item.ping_status,
						categories: item.categories,
						tags: item.tags,
					},
					{ throwOnError: true }
				);

				createSuccessNotice(
					sprintf(
						// translators: %s: Title of the created template e.g: "Category".
						__( '"%s" successfully created.' ),
						newItem.title?.rendered || title
					),
					{
						id: 'duplicate-post-action',
						type: 'snackbar',
					}
				);

				if ( onActionPerformed ) {
					onActionPerformed( [ newItem ] );
				}
			} catch ( error ) {
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: __( 'An error occurred while duplicating the page.' );

				createErrorNotice( errorMessage, {
					type: 'snackbar',
				} );
			} finally {
				setIsCreatingPage( false );
				closeModal();
			}
		}
		return (
			<form onSubmit={ createPage }>
				<VStack spacing={ 3 }>
					<TextControl
						label={ __( 'Title' ) }
						onChange={ setTitle }
						placeholder={ __( 'No title' ) }
						value={ title }
					/>
					<HStack spacing={ 2 } justify="end">
						<Button variant="tertiary" onClick={ closeModal }>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							isBusy={ isCreatingPage }
							aria-disabled={ isCreatingPage }
						>
							{ _x( 'Duplicate', 'action label' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

const isTemplatePartRevertable = ( item ) => {
	if ( ! item ) {
		return false;
	}
	const hasThemeFile = item.templatePart?.has_theme_file;
	return canDeleteOrReset( item ) && hasThemeFile;
};

const resetTemplateAction = {
	id: 'reset-template',
	label: __( 'Reset' ),
	isEligible: ( item ) => {
		return item.type === TEMPLATE_PART_POST_TYPE
			? isTemplatePartRevertable( item )
			: isTemplateRevertable( item );
	},
	icon: backup,
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( {
		items,
		closeModal,
		onActionStart,
		onActionPerformed,
	} ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { revertTemplate, removeTemplates } = unlock(
			useDispatch( editorStore )
		);
		const { saveEditedEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const onConfirm = async () => {
			try {
				if ( items[ 0 ].type === TEMPLATE_PART_POST_TYPE ) {
					await removeTemplates( items );
				} else {
					for ( const template of items ) {
						if ( template.type === TEMPLATE_POST_TYPE ) {
							await revertTemplate( template, {
								allowUndo: false,
							} );
							await saveEditedEntityRecord(
								'postType',
								template.type,
								template.id
							);
						}
					}
					createSuccessNotice(
						items.length > 1
							? sprintf(
									/* translators: The number of items. */
									__( '%s items reset.' ),
									items.length
							  )
							: sprintf(
									/* translators: The template/part's name. */
									__( '"%s" reset.' ),
									decodeEntities( getItemTitle( items[ 0 ] ) )
							  ),
						{
							type: 'snackbar',
							id: 'revert-template-action',
						}
					);
				}
			} catch ( error ) {
				let fallbackErrorMessage;
				if ( items[ 0 ].type === TEMPLATE_POST_TYPE ) {
					fallbackErrorMessage =
						items.length === 1
							? __(
									'An error occurred while reverting the template.'
							  )
							: __(
									'An error occurred while reverting the templates.'
							  );
				} else {
					fallbackErrorMessage =
						items.length === 1
							? __(
									'An error occurred while reverting the template part.'
							  )
							: __(
									'An error occurred while reverting the template parts.'
							  );
				}
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: fallbackErrorMessage;

				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		};
		return (
			<VStack spacing="5">
				<Text>
					{ __( 'Reset to default and clear all customizations?' ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						__experimentalIsFocusable
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							if ( onActionStart ) {
								onActionStart( items );
							}
							await onConfirm( items );
							onActionPerformed?.( items );
							setIsBusy( false );
							closeModal();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						__experimentalIsFocusable
					>
						{ __( 'Reset' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

/**
 * Check if a template is removable.
 * Copy from packages/edit-site/src/utils/is-template-removable.js.
 *
 * @param {Object} template The template entity to check.
 * @return {boolean} Whether the template is revertable.
 */
function isTemplateRemovable( template ) {
	if ( ! template ) {
		return false;
	}

	return (
		template.source === TEMPLATE_ORIGINS.custom && ! template.has_theme_file
	);
}

const deleteTemplateAction = {
	id: 'delete-template',
	label: __( 'Delete' ),
	isEligible: isTemplateRemovable,
	icon: trash,
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( {
		items: templates,
		closeModal,
		onActionStart,
		onActionPerformed,
	} ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { removeTemplates } = unlock( useDispatch( editorStore ) );
		return (
			<VStack spacing="5">
				<Text>
					{ templates.length > 1
						? sprintf(
								// translators: %d: number of items to delete.
								_n(
									'Delete %d item?',
									'Delete %d items?',
									templates.length
								),
								templates.length
						  )
						: sprintf(
								// translators: %s: The template or template part's titles
								__( 'Delete "%s"?' ),
								decodeEntities(
									templates?.[ 0 ]?.title?.rendered
								)
						  ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						__experimentalIsFocusable
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							if ( onActionStart ) {
								onActionStart( templates );
							}
							await removeTemplates( templates, {
								allowUndo: false,
							} );
							onActionPerformed?.( templates );
							setIsBusy( false );
							closeModal();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						__experimentalIsFocusable
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

const canDeleteOrReset = ( item ) => {
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const isUserPattern = item.type === PATTERN_TYPES.user;
	return isUserPattern || ( isTemplatePart && item.isCustom );
};

export const deletePatternAction = {
	id: 'delete-pattern',
	label: __( 'Delete' ),
	isEligible: ( item ) => {
		if ( ! item ) {
			return false;
		}
		const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
		const hasThemeFile =
			isTemplatePart && item.templatePart?.has_theme_file;
		return canDeleteOrReset( item ) && ! hasThemeFile;
	},
	hideModalHeader: true,
	supportsBulk: true,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const { __experimentalDeleteReusableBlock } =
			useDispatch( reusableBlocksStore );
		const { createErrorNotice, createSuccessNotice } =
			useDispatch( noticesStore );
		const { removeTemplates } = unlock( useDispatch( editorStore ) );

		const deletePattern = async () => {
			const promiseResult = await Promise.allSettled(
				items.map( ( item ) => {
					return __experimentalDeleteReusableBlock( item.id );
				} )
			);
			// If all the promises were fulfilled with success.
			if (
				promiseResult.every( ( { status } ) => status === 'fulfilled' )
			) {
				let successMessage;
				if ( promiseResult.length === 1 ) {
					successMessage = sprintf(
						/* translators: The posts's title. */
						__( '"%s" deleted.' ),
						items[ 0 ].title
					);
				} else {
					successMessage = __( 'The patterns were deleted.' );
				}
				createSuccessNotice( successMessage, {
					type: 'snackbar',
					id: 'edit-site-page-trashed',
				} );
			} else {
				// If there was at lease one failure.
				let errorMessage;
				// If we were trying to delete a single pattern.
				if ( promiseResult.length === 1 ) {
					if ( promiseResult[ 0 ].reason?.message ) {
						errorMessage = promiseResult[ 0 ].reason.message;
					} else {
						errorMessage = __(
							'An error occurred while deleting the pattern.'
						);
					}
					// If we were trying to delete multiple patterns.
				} else {
					const errorMessages = new Set();
					const failedPromises = promiseResult.filter(
						( { status } ) => status === 'rejected'
					);
					for ( const failedPromise of failedPromises ) {
						if ( failedPromise.reason?.message ) {
							errorMessages.add( failedPromise.reason.message );
						}
					}
					if ( errorMessages.size === 0 ) {
						errorMessage = __(
							'An error occurred while deleting the patterns.'
						);
					} else if ( errorMessages.size === 1 ) {
						errorMessage = sprintf(
							/* translators: %s: an error message */
							__(
								'An error occurred while deleting the patterns: %s'
							),
							[ ...errorMessages ][ 0 ]
						);
					} else {
						errorMessage = sprintf(
							/* translators: %s: a list of comma separated error messages */
							__(
								'Some errors occurred while deleting the patterns: %s'
							),
							[ ...errorMessages ].join( ',' )
						);
					}
					createErrorNotice( errorMessage, {
						type: 'snackbar',
					} );
				}
			}
		};
		const deleteItem = () => {
			if ( items[ 0 ].type === TEMPLATE_PART_POST_TYPE ) {
				removeTemplates( items );
			} else {
				deletePattern();
			}
			if ( onActionPerformed ) {
				onActionPerformed();
			}
			closeModal();
		};
		let questionMessage;
		if ( items.length === 1 ) {
			questionMessage = sprintf(
				// translators: %s: The page's title.
				__( 'Are you sure you want to delete "%s"?' ),
				decodeEntities( items[ 0 ].title || items[ 0 ].name )
			);
		} else if (
			items.length > 1 &&
			items[ 0 ].type === TEMPLATE_PART_POST_TYPE
		) {
			questionMessage = sprintf(
				// translators: %d: The number of template parts (2 or more).
				__( 'Are you sure you want to delete %d template parts?' ),
				items.length
			);
		} else {
			questionMessage = sprintf(
				// translators: %d: The number of patterns (2 or more).
				__( 'Are you sure you want to delete %d patterns?' ),
				items.length
			);
		}
		return (
			<VStack spacing="5">
				<Text>{ questionMessage }</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button variant="primary" onClick={ deleteItem }>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export function usePostActions( postType, onActionPerformed ) {
	const { postTypeObject } = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			return {
				postTypeObject: getPostType( postType ),
			};
		},
		[ postType ]
	);

	const permanentlyDeletePostAction = usePermanentlyDeletePostAction();
	const restorePostAction = useRestorePostAction();
	const isTemplateOrTemplatePart = [
		TEMPLATE_POST_TYPE,
		TEMPLATE_PART_POST_TYPE,
	].includes( postType );
	const isPattern = postType === PATTERN_POST_TYPE;
	const isLoaded = !! postTypeObject;
	return useMemo( () => {
		if ( ! isLoaded ) {
			return [];
		}

		const actions = [
			postTypeObject?.viewable && viewPostAction,
			postRevisionsAction,
			globalThis.IS_GUTENBERG_PLUGIN
				? ! isTemplateOrTemplatePart &&
				  ! isPattern &&
				  duplicatePostAction
				: false,
			renamePostAction,
			isPattern && exportPatternAsJSONAction,
			isTemplateOrTemplatePart ? resetTemplateAction : restorePostAction,
			isTemplateOrTemplatePart
				? deleteTemplateAction
				: permanentlyDeletePostAction,
			isPattern && deletePatternAction,
			! isTemplateOrTemplatePart && trashPostAction,
		].filter( Boolean );

		if ( onActionPerformed ) {
			for ( let i = 0; i < actions.length; ++i ) {
				if ( actions[ i ].callback ) {
					const existingCallback = actions[ i ].callback;
					actions[ i ] = {
						...actions[ i ],
						callback: ( items, _onActionPerformed ) => {
							existingCallback( items, ( _items ) => {
								if ( _onActionPerformed ) {
									_onActionPerformed( _items );
								}
								onActionPerformed( actions[ i ].id, _items );
							} );
						},
					};
				}
				if ( actions[ i ].RenderModal ) {
					const ExistingRenderModal = actions[ i ].RenderModal;
					actions[ i ] = {
						...actions[ i ],
						RenderModal: ( props ) => {
							return (
								<ExistingRenderModal
									{ ...props }
									onActionPerformed={ ( _items ) => {
										if ( props.onActionPerformed ) {
											props.onActionPerformed( _items );
										}
										onActionPerformed(
											actions[ i ].id,
											_items
										);
									} }
								/>
							);
						},
					};
				}
			}
		}

		return actions;
	}, [
		isTemplateOrTemplatePart,
		isPattern,
		postTypeObject?.viewable,
		permanentlyDeletePostAction,
		restorePostAction,
		onActionPerformed,
		isLoaded,
	] );
}
