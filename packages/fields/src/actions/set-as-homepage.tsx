/**
 * WordPress dependencies
 */
import { select, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { getItemTitle } from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

const PAGE_POST_TYPE = 'page';

const renamePost: Action< PostWithPermissions > = {
	id: 'set-as-homepage',
	label: __( 'Set as homepage' ),
	isEligible( post ) {
		if ( post.status === 'trash' ) {
			return false;
		}

		if ( post.type !== PAGE_POST_TYPE ) {
			return false;
		}

		// @ts-ignore
		const { page_on_front: pageOnFront } = select(
			coreStore
			// @ts-ignore
		).getEntityRecord( 'root', 'site' );

		return pageOnFront !== post.id;
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const [ title ] = useState( () => getItemTitle( item ) );
		const { editEntityRecord, saveEditedEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onSetAsHomepage( event: React.FormEvent ) {
			event.preventDefault();
			try {
				// @ts-ignore
				await editEntityRecord( 'root', 'site', undefined, {
					page_on_front: item.id,
				} );
				closeModal?.();
				// Persist edited entity.
				// @ts-ignore
				await saveEditedEntityRecord( 'root', 'site', undefined, {
					page_on_front: item.id,
				} );
				createSuccessNotice( __( 'This page set as homepage' ), {
					type: 'snackbar',
				} );
				onActionPerformed?.( items );
			} catch ( error ) {
				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
						: __(
								'An error occurred while setting this page as homepage'
						  );
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}

		return (
			<form onSubmit={ onSetAsHomepage }>
				<VStack spacing="5">
					<Text>{ title }</Text>
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
							{ __( 'Set as homepage' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

export default renamePost;
