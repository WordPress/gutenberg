/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
// @ts-ignore
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import {
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */

import { unlock } from '../lock-unlock';
import {
	getItemTitle,
	isTemplateRemovable,
	isTemplate,
	isTemplatePart,
} from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

// Patterns.
const { PATTERN_TYPES } = unlock( patternsPrivateApis );

const renamePost: Action< PostWithPermissions > = {
	id: 'rename-post',
	label: __( 'Rename' ),
	modalFocusOnMount: 'firstContentElement',
	isEligible( post ) {
		if ( post.status === 'trash' ) {
			return false;
		}

		// Non-database template cannot be edited.
		if (
			post.type === 'wp_template' &&
			typeof post.id === 'string' &&
			window?.__experimentalTemplateActivate
		) {
			return false;
		}

		const specialChecks = [ 'wp_template', 'wp_template_part' ];

		if ( ! window?.__experimentalTemplateActivate ) {
			specialChecks.push( 'wp_template' );
		}

		// Templates, template parts and patterns have special checks for renaming.
		if ( ! specialChecks.includes( post.type ) ) {
			return post.permissions?.update;
		}

		// In the case of templates, we can only rename custom templates.
		if ( isTemplate( post ) && ! window?.__experimentalTemplateActivate ) {
			return (
				isTemplateRemovable( post ) &&
				post.is_custom &&
				post.permissions?.update
			);
		}

		if ( isTemplatePart( post ) ) {
			return (
				post.source === 'custom' &&
				! post?.has_theme_file &&
				post.permissions?.update
			);
		}

		return post.type === PATTERN_TYPES.user && post.permissions?.update;
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const [ title, setTitle ] = useState( () => getItemTitle( item, '' ) );
		const { editEntityRecord, saveEditedEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onRename( event: React.FormEvent ) {
			event.preventDefault();
			try {
				await editEntityRecord( 'postType', item.type, item.id, {
					title,
				} );
				// Update state before saving rerenders the list.
				setTitle( '' );
				closeModal?.();
				// Persist edited entity.
				await saveEditedEntityRecord( 'postType', item.type, item.id, {
					throwOnError: true,
				} );
				createSuccessNotice( __( 'Name updated' ), {
					type: 'snackbar',
				} );
				onActionPerformed?.( items );
			} catch ( error ) {
				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
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
};

/**
 * Rename action for PostWithPermissions.
 */
export default renamePost;
