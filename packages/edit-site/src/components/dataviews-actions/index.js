/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit, cog } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

const assignHierarchySlotAction = {
	id: 'set-active-template',
	label( items ) {
		return items.some( ( item ) => item._isActive )
			? __( 'Change Slot Assignment' )
			: __( 'Assign to Slot' );
	},
	isPrimary: true,
	icon: edit,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		// const [ item ] = items;
		// const { editEntityRecord, saveEditedEntityRecord } =
		// 	useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onAssign( event ) {
			event.preventDefault();
			try {
				// await editEntityRecord( 'postType', item.type, item.id, {
				// 	title,
				// } );
				closeModal?.();
				// Persist edited entity.
				// await saveEditedEntityRecord( 'postType', item.type, item.id, {
				// 	throwOnError: true,
				// } );
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
			<form onSubmit={ onAssign }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Name' ) }
						value=""
						onChange={ () => {} }
						required
					/>
					<HStack justify="right">
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
	// async _callback( items ) {
	// 	const deactivate = items.some( ( item ) => item._isActive );
	// 	// current active templates
	// 	const activeTemplates = {
	// 		...( ( await getEntityRecord( 'root', 'site' ).active_templates ) ??
	// 			{} ),
	// 	};
	// 	for ( const item of items ) {
	// 		if ( deactivate ) {
	// 			if ( item.source === 'theme' ) {
	// 				activeTemplates[ item.slug ] = false;
	// 			} else {
	// 				delete activeTemplates[ item.slug ];
	// 			}
	// 		} else {
	// 			activeTemplates[ item.slug ] = item.id;
	// 		}
	// 	}
	// 	// To do: figure out why the REST API deletes the option when
	// 	// it's set to an empty object. That would trigger the migration
	// 	// function, which will make all templates in the database active.
	// 	activeTemplates.__preventCollapse = 0;
	// 	await editEntityRecord( 'root', 'site', undefined, {
	// 		active_templates: activeTemplates,
	// 	} );
	// 	await saveEditedEntityRecord( 'root', 'site' );
	// },
};

export const useSetActiveTemplateAction = () => {
	// const { getEntityRecord } = useSelect( coreStore );
	// const { editEntityRecord, saveEditedEntityRecord } =
	// 	useDispatch( coreStore );
	return assignHierarchySlotAction;
};

export const useAssignHierarchySlotAction = () => {
	const { getEntityRecord } = useSelect( coreStore );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	return useMemo(
		() => ( {
			id: 'assign-hierarchy-slot',
			label( items ) {
				return items.some( ( item ) => item._isAssigned )
					? __( 'Unassign' )
					: __( 'Assign' );
			},
			isPrimary: true,
			icon: cog,
			isEligible( item ) {
				return ! ( item.slug === 'index' );
			},
			async callback( items ) {
				const deactivate = items.some( ( item ) => item._isActive );
				// current active templates
				const activeTemplates = {
					...( ( await getEntityRecord( 'root', 'site' )
						.active_templates ) ?? {} ),
				};
				for ( const item of items ) {
					if ( deactivate ) {
						if ( item.source === 'theme' ) {
							activeTemplates[ item.slug ] = false;
						} else {
							delete activeTemplates[ item.slug ];
						}
					} else {
						activeTemplates[ item.slug ] = item.id;
					}
				}
				// To do: figure out why the REST API deletes the option when
				// it's set to an empty object. That would trigger the migration
				// function, which will make all templates in the database active.
				activeTemplates.__preventCollapse = 0;
				await editEntityRecord( 'root', 'site', undefined, {
					active_templates: activeTemplates,
				} );
				await saveEditedEntityRecord( 'root', 'site' );
			},
		} ),
		[ editEntityRecord, saveEditedEntityRecord, getEntityRecord ]
	);
};

export const useEditPostAction = () => {
	const history = useHistory();
	return useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			isPrimary: true,
			icon: edit,
			isEligible( post ) {
				if ( post.status === 'trash' ) {
					return false;
				}
				// It's eligible for all post types except theme patterns.
				return post.type !== PATTERN_TYPES.theme;
			},
			callback( items ) {
				const post = items[ 0 ];
				history.navigate( `/${ post.type }/${ post.id }?canvas=edit` );
			},
		} ),
		[ history ]
	);
};
