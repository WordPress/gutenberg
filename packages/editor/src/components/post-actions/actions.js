/**
 * WordPress dependencies
 */
import { external, backup } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { parse } from '@wordpress/blocks';
import { DataForm, isItemValid } from '@wordpress/dataviews';
import {
	Button,
	TextControl,
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
import { CreateTemplatePartModalContents } from '../create-template-part-modal';
import { getItemTitle } from '../../dataviews/actions/utils';

// Patterns.
const { PATTERN_TYPES, CreatePatternModalContents, useDuplicatePatternProps } =
	unlock( patternsPrivateApis );

// TODO: this should be shared with other components (see post-fields in edit-site).
const fields = [
	{
		type: 'text',
		id: 'title',
		label: __( 'Title' ),
		placeholder: __( 'No title' ),
		getValue: ( { item } ) => item.title,
	},
	{
		type: 'integer',
		id: 'menu_order',
		label: __( 'Order' ),
		description: __( 'Determines the order of pages.' ),
	},
];

const formDuplicateAction = {
	visibleFields: [ 'title' ],
};

const formOrderAction = {
	visibleFields: [ 'menu_order' ],
};

/**
 * Check if a template is removable.
 *
 * @param {Object} template The template entity to check.
 * @return {boolean} Whether the template is removable.
 */
function isTemplateRemovable( template ) {
	if ( ! template ) {
		return false;
	}
	// In patterns list page we map the templates parts to a different object
	// than the one returned from the endpoint. This is why we need to check for
	// two props whether is custom or has a theme file.
	return (
		template?.source === TEMPLATE_ORIGINS.custom &&
		! template?.has_theme_file
	);
}

const restorePostAction = {
	id: 'restore',
	label: __( 'Restore' ),
	isPrimary: true,
	icon: backup,
	supportsBulk: true,
	isEligible( { status, permissions } ) {
		return status === 'trash' && permissions?.update;
	},
	async callback( posts, { registry, onActionPerformed } ) {
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		const { editEntityRecord, saveEditedEntityRecord } =
			registry.dispatch( coreStore );
		await Promise.allSettled(
			posts.map( ( post ) => {
				return editEntityRecord( 'postType', post.type, post.id, {
					status: 'draft',
				} );
			} )
		);
		const promiseResult = await Promise.allSettled(
			posts.map( ( post ) => {
				return saveEditedEntityRecord( 'postType', post.type, post.id, {
					throwOnError: true,
				} );
			} )
		);

		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
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
						errorMessages.add( failedPromise.reason.message );
					}
				}
				if ( errorMessages.size === 0 ) {
					errorMessage = __(
						'An error occurred while restoring the posts.'
					);
				} else if ( errorMessages.size === 1 ) {
					errorMessage = sprintf(
						/* translators: %s: an error message */
						__( 'An error occurred while restoring the posts: %s' ),
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
};

const viewPostAction = {
	id: 'view-post',
	label: __( 'View' ),
	isPrimary: true,
	icon: external,
	isEligible( post ) {
		return post.status !== 'trash';
	},
	callback( posts, { onActionPerformed } ) {
		const post = posts[ 0 ];
		window.open( post.link, '_blank' );
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

const postRevisionsAction = {
	id: 'view-post-revisions',
	context: 'list',
	label( items ) {
		const revisionsCount =
			items[ 0 ]._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return sprintf(
			/* translators: %s: number of revisions */
			__( 'View revisions (%s)' ),
			revisionsCount
		);
	},
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
	callback( posts, { onActionPerformed } ) {
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
			return post.permissions?.update;
		}
		// In the case of templates, we can only rename custom templates.
		if ( post.type === TEMPLATE_POST_TYPE ) {
			return (
				isTemplateRemovable( post ) &&
				post.is_custom &&
				post.permissions?.update
			);
		}
		// Make necessary checks for template parts and patterns.
		const isTemplatePart = post.type === TEMPLATE_PART_POST_TYPE;
		const isUserPattern = post.type === PATTERN_TYPES.user;
		// In patterns list page we map the templates parts to a different object
		// than the one returned from the endpoint. This is why we need to check for
		// two props whether is custom or has a theme file.
		const isCustomPattern =
			isUserPattern ||
			( isTemplatePart && post.source === TEMPLATE_ORIGINS.custom );
		const hasThemeFile = post?.has_theme_file;
		return isCustomPattern && ! hasThemeFile && post.permissions?.update;
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const [ title, setTitle ] = useState( () => getItemTitle( item ) );
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

function ReorderModal( { items, closeModal, onActionPerformed } ) {
	const [ item, setItem ] = useState( items[ 0 ] );
	const orderInput = item.menu_order;
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onOrder( event ) {
		event.preventDefault();

		if ( ! isItemValid( item, fields, formOrderAction ) ) {
			return;
		}

		try {
			await editEntityRecord( 'postType', item.type, item.id, {
				menu_order: orderInput,
			} );
			closeModal();
			// Persist edited entity.
			await saveEditedEntityRecord( 'postType', item.type, item.id, {
				throwOnError: true,
			} );
			createSuccessNotice( __( 'Order updated' ), {
				type: 'snackbar',
			} );
			onActionPerformed?.( items );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the order' );
			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	}
	const isSaveDisabled = ! isItemValid( item, fields, formOrderAction );
	return (
		<form onSubmit={ onOrder }>
			<VStack spacing="5">
				<div>
					{ __(
						'Determines the order of pages. Pages with the same order value are sorted alphabetically. Negative order values are supported.'
					) }
				</div>
				<DataForm
					data={ item }
					fields={ fields }
					form={ formOrderAction }
					onChange={ setItem }
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
						accessibleWhenDisabled
						disabled={ isSaveDisabled }
						__experimentalIsFocusable
					>
						{ __( 'Save' ) }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}

function useReorderPagesAction( postType ) {
	const supportsPageAttributes = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			const postTypeObject = getPostType( postType );

			return !! postTypeObject?.supports?.[ 'page-attributes' ];
		},
		[ postType ]
	);

	return useMemo(
		() =>
			supportsPageAttributes && {
				id: 'order-pages',
				label: __( 'Order' ),
				isEligible( { status } ) {
					return status !== 'trash';
				},
				RenderModal: ReorderModal,
			},
		[ supportsPageAttributes ]
	);
}

const useDuplicatePostAction = ( postType ) => {
	const userCanCreatePost = useSelect(
		( select ) => {
			return select( coreStore ).canUser( 'create', {
				kind: 'postType',
				name: postType,
			} );
		},
		[ postType ]
	);
	return useMemo(
		() =>
			userCanCreatePost && {
				id: 'duplicate-post',
				label: _x( 'Duplicate', 'action label' ),
				isEligible( { status } ) {
					return status !== 'trash';
				},
				RenderModal: ( { items, closeModal, onActionPerformed } ) => {
					const [ item, setItem ] = useState( {
						...items[ 0 ],
						title: sprintf(
							/* translators: %s: Existing template title */
							__( '%s (Copy)' ),
							getItemTitle( items[ 0 ] )
						),
					} );

					const [ isCreatingPage, setIsCreatingPage ] =
						useState( false );

					const { saveEntityRecord } = useDispatch( coreStore );
					const { createSuccessNotice, createErrorNotice } =
						useDispatch( noticesStore );

					async function createPage( event ) {
						event.preventDefault();

						if ( isCreatingPage ) {
							return;
						}

						const newItemOject = {
							status: 'draft',
							title: item.title,
							slug: item.title || __( 'No title' ),
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
						};
						const assignablePropertiesPrefix = 'wp:action-assign-';
						// Get all the properties that the current user is able to assign normally author, categories, tags,
						// and custom taxonomies.
						const assignableProperties = Object.keys(
							item?._links || {}
						)
							.filter( ( property ) =>
								property.startsWith(
									assignablePropertiesPrefix
								)
							)
							.map( ( property ) =>
								property.slice(
									assignablePropertiesPrefix.length
								)
							);
						assignableProperties.forEach( ( property ) => {
							if ( item[ property ] ) {
								newItemOject[ property ] = item[ property ];
							}
						} );
						setIsCreatingPage( true );
						try {
							const newItem = await saveEntityRecord(
								'postType',
								item.type,
								newItemOject,
								{ throwOnError: true }
							);

							createSuccessNotice(
								sprintf(
									// translators: %s: Title of the created template e.g: "Category".
									__( '"%s" successfully created.' ),
									decodeEntities(
										newItem.title?.rendered || item.title
									)
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
									: __(
											'An error occurred while duplicating the page.'
									  );

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
								<DataForm
									data={ item }
									fields={ fields }
									form={ formDuplicateAction }
									onChange={ setItem }
								/>
								<HStack spacing={ 2 } justify="end">
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
										isBusy={ isCreatingPage }
										aria-disabled={ isCreatingPage }
										__next40pxDefaultSize
									>
										{ _x( 'Duplicate', 'action label' ) }
									</Button>
								</HStack>
							</VStack>
						</form>
					);
				},
			},
		[ userCanCreatePost ]
	);
};

export const duplicatePatternAction = {
	id: 'duplicate-pattern',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type !== TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate pattern', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const duplicatedProps = useDuplicatePatternProps( {
			pattern: item,
			onSuccess: () => closeModal(),
		} );
		return (
			<CreatePatternModalContents
				onClose={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
				{ ...duplicatedProps }
			/>
		);
	},
};

export const duplicateTemplatePartAction = {
	id: 'duplicate-template-part',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type === TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate template part', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const blocks = useMemo( () => {
			return (
				item.blocks ??
				parse(
					typeof item.content === 'string'
						? item.content
						: item.content.raw,
					{
						__unstableSkipMigrationLogs: true,
					}
				)
			);
		}, [ item.content, item.blocks ] );
		const { createSuccessNotice } = useDispatch( noticesStore );
		function onTemplatePartSuccess() {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					getItemTitle( item )
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
			closeModal();
		}
		return (
			<CreateTemplatePartModalContents
				blocks={ blocks }
				defaultArea={ item.area }
				defaultTitle={ sprintf(
					/* translators: %s: Existing template part title */
					__( '%s (Copy)' ),
					getItemTitle( item )
				) }
				onCreate={ onTemplatePartSuccess }
				onError={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
			/>
		);
	},
};

export function usePostActions( { postType, onActionPerformed, context } ) {
	const { defaultActions, postTypeObject, userCanCreatePostType } = useSelect(
		( select ) => {
			const { getPostType, canUser } = select( coreStore );
			const { getEntityActions } = unlock( select( editorStore ) );
			return {
				postTypeObject: getPostType( postType ),
				defaultActions: getEntityActions( 'postType', postType ),
				userCanCreatePostType: canUser( 'create', {
					kind: 'postType',
					name: postType,
				} ),
			};
		},
		[ postType ]
	);

	const duplicatePostAction = useDuplicatePostAction( postType );
	const reorderPagesAction = useReorderPagesAction( postType );
	const isTemplateOrTemplatePart = [
		TEMPLATE_POST_TYPE,
		TEMPLATE_PART_POST_TYPE,
	].includes( postType );
	const isPattern = postType === PATTERN_POST_TYPE;
	const isLoaded = !! postTypeObject;
	const supportsRevisions = !! postTypeObject?.supports?.revisions;
	const supportsTitle = !! postTypeObject?.supports?.title;
	return useMemo( () => {
		if ( ! isLoaded ) {
			return [];
		}

		let actions = [
			postTypeObject?.viewable && viewPostAction,
			supportsRevisions && postRevisionsAction,
			globalThis.IS_GUTENBERG_PLUGIN
				? ! isTemplateOrTemplatePart &&
				  ! isPattern &&
				  duplicatePostAction
				: false,
			isTemplateOrTemplatePart &&
				userCanCreatePostType &&
				duplicateTemplatePartAction,
			isPattern && userCanCreatePostType && duplicatePatternAction,
			supportsTitle && renamePostAction,
			reorderPagesAction,
			! isTemplateOrTemplatePart && ! isPattern && restorePostAction,
			...defaultActions,
		].filter( Boolean );
		// Filter actions based on provided context. If not provided
		// all actions are returned. We'll have a single entry for getting the actions
		// and the consumer should provide the context to filter the actions, if needed.
		// Actions should also provide the `context` they support, if it's specific, to
		// compare with the provided context to get all the actions.
		// Right now the only supported context is `list`.
		actions = actions.filter( ( action ) => {
			if ( ! action.context ) {
				return true;
			}
			return action.context === context;
		} );

		if ( onActionPerformed ) {
			for ( let i = 0; i < actions.length; ++i ) {
				if ( actions[ i ].callback ) {
					const existingCallback = actions[ i ].callback;
					actions[ i ] = {
						...actions[ i ],
						callback: ( items, argsObject ) => {
							existingCallback( items, {
								...argsObject,
								onActionPerformed: ( _items ) => {
									if ( argsObject?.onActionPerformed ) {
										argsObject.onActionPerformed( _items );
									}
									onActionPerformed(
										actions[ i ].id,
										_items
									);
								},
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
		defaultActions,
		userCanCreatePostType,
		isTemplateOrTemplatePart,
		isPattern,
		postTypeObject?.viewable,
		duplicatePostAction,
		reorderPagesAction,
		onActionPerformed,
		isLoaded,
		supportsRevisions,
		supportsTitle,
		context,
	] );
}
