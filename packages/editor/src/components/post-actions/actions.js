/**
 * WordPress dependencies
 */
import { external, trash, edit, backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo, useState } from '@wordpress/element';

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
import { TEMPLATE_ORIGINS, TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import isTemplateRevertable from '../../store/utils/is-template-revertable';

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
	isEligible( { status } ) {
		return status !== 'trash';
	},
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items: posts, closeModal, onActionPerformed } ) => {
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
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
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
								} else {
									successMessage = __(
										'Pages moved to the Trash.'
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
							closeModal();
						} }
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
				try {
					for ( const post of posts ) {
						await editEntityRecord(
							'postType',
							post.type,
							post.id,
							{
								status: 'draft',
							}
						);
						await saveEditedEntityRecord(
							'postType',
							post.type,
							post.id,
							{ throwOnError: true }
						);
					}

					createSuccessNotice(
						posts.length > 1
							? sprintf(
									/* translators: The number of posts. */
									__( '%d posts have been restored.' ),
									posts.length
							  )
							: sprintf(
									/* translators: The number of posts. */
									__( '"%s" has been restored.' ),
									getItemTitle( posts[ 0 ] )
							  ),
						{
							type: 'snackbar',
							id: 'restore-post-action',
						}
					);
					if ( onActionPerformed ) {
						onActionPerformed( posts );
					}
				} catch ( error ) {
					let errorMessage;
					if (
						error.message &&
						error.code !== 'unknown_error' &&
						error.message
					) {
						errorMessage = error.message;
					} else if ( posts.length > 1 ) {
						errorMessage = __(
							'An error occurred while restoring the posts.'
						);
					} else {
						errorMessage = __(
							'An error occurred while restoring the post.'
						);
					}

					createErrorNotice( errorMessage, { type: 'snackbar' } );
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

const editPostAction = {
	id: 'edit-post',
	label: __( 'Edit' ),
	isPrimary: true,
	icon: edit,
	isEligible( { status } ) {
		return status !== 'trash';
	},
	callback( posts, onActionPerformed ) {
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
		return post.status !== 'trash';
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

export const duplicatePostAction = {
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

const resetTemplateAction = {
	id: 'reset-template',
	label: __( 'Reset' ),
	isEligible: isTemplateRevertable,
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const { revertTemplate } = unlock( useDispatch( editorStore ) );
		const { saveEditedEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const onConfirm = async () => {
			try {
				for ( const template of items ) {
					await revertTemplate( template, {
						allowUndo: false,
					} );
					await saveEditedEntityRecord(
						'postType',
						template.type,
						template.id
					);
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
								decodeEntities( items[ 0 ].title.rendered )
						  ),
					{
						type: 'snackbar',
						id: 'revert-template-action',
					}
				);
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
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							await onConfirm( items );
							onActionPerformed?.( items );
							closeModal();
						} }
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
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items: templates, closeModal, onActionPerformed } ) => {
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
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							await removeTemplates( templates, {
								allowUndo: false,
							} );
							onActionPerformed?.( templates );
							closeModal();
						} }
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

const renameTemplateAction = {
	id: 'rename-template',
	label: __( 'Rename' ),
	isEligible: ( template ) => {
		// We can only remove templates or template parts that can be removed.
		// Additionally in the case of templates, we can only remove custom templates.
		if (
			! isTemplateRemovable( template ) ||
			( template.type === TEMPLATE_POST_TYPE && ! template.is_custom )
		) {
			return false;
		}
		return true;
	},
	RenderModal: ( { items: templates, closeModal, onActionPerformed } ) => {
		const template = templates[ 0 ];
		const title = decodeEntities( template.title.rendered );
		const [ editedTitle, setEditedTitle ] = useState( title );
		const {
			editEntityRecord,
			__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
		} = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		async function onTemplateRename( event ) {
			event.preventDefault();
			try {
				await editEntityRecord(
					'postType',
					template.type,
					template.id,
					{
						title: editedTitle,
					}
				);
				// Update state before saving rerenders the list.
				setEditedTitle( '' );
				closeModal();
				// Persist edited entity.
				await saveSpecifiedEntityEdits(
					'postType',
					template.type,
					template.id,
					[ 'title' ], // Only save title to avoid persisting other edits.
					{
						throwOnError: true,
					}
				);
				createSuccessNotice(
					template.type === TEMPLATE_POST_TYPE
						? __( 'Template renamed.' )
						: __( 'Template part renamed.' ),
					{
						type: 'snackbar',
					}
				);
				onActionPerformed?.( templates );
			} catch ( error ) {
				const fallbackErrorMessage =
					template.type === TEMPLATE_POST_TYPE
						? __( 'An error occurred while renaming the template.' )
						: __(
								'An error occurred while renaming the template part.'
						  );
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: fallbackErrorMessage;

				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}
		return (
			<form onSubmit={ onTemplateRename }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Name' ) }
						value={ editedTitle }
						onChange={ setEditedTitle }
						required
					/>
					<HStack justify="right">
						<Button
							variant="tertiary"
							onClick={ closeModal }
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							__next40pxDefaultSize
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

export function usePostActions( onActionPerformed, actionIds = null ) {
	const permanentlyDeletePostAction = usePermanentlyDeletePostAction();
	const restorePostAction = useRestorePostAction();
	return useMemo(
		() => {
			// By default, return all actions...
			const defaultActions = [
				editPostAction,
				resetTemplateAction,
				viewPostAction,
				restorePostAction,
				deleteTemplateAction,
				permanentlyDeletePostAction,
				postRevisionsAction,
				duplicatePostAction,
				renamePostAction,
				renameTemplateAction,
				trashPostAction,
			];

			// ... unless `actionIds` was specified, in which case we find the
			// actions matching the given IDs.
			const actions = actionIds
				? actionIds.map( ( actionId ) =>
						defaultActions.find( ( { id } ) => actionId === id )
				  )
				: defaultActions;

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
									onActionPerformed(
										actions[ i ].id,
										_items
									);
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
										items={ props.items }
										closeModal={ props.closeModal }
										onActionPerformed={ ( _items ) => {
											if ( props.onActionPerformed ) {
												props.onActionPerformed(
													_items
												);
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
		},

		// Disable reason: if provided, `actionIds` is a shallow array of
		// strings, and the strings themselves should be part of the useMemo
		// dependencies. Two different disable statements are needed, as the
		// first flags what it thinks are missing dependencies, and the second
		// flags the array spread operation.
		//
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			// eslint-disable-next-line react-hooks/exhaustive-deps
			...( actionIds || [] ),
			permanentlyDeletePostAction,
			restorePostAction,
			onActionPerformed,
		]
	);
}
