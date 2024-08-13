/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from '@wordpress/element';
import { DataForm } from '@wordpress/dataviews';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../dataviews/actions/utils';
import type { CoreDataError, BasePost } from '../types';
import { titleField } from '../fields';

const fields = [ titleField ];
const formDuplicateAction = {
	fields: [ 'title' ],
};

const duplicatePost: Action< BasePost > = {
	id: 'duplicate-post',
	label: _x( 'Duplicate', 'action label' ),
	isEligible( { status } ) {
		return status !== 'trash';
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item, setItem ] = useState< BasePost >( {
			...items[ 0 ],
			title: sprintf(
				/* translators: %s: Existing template title */
				__( '%s (Copy)' ),
				getItemTitle( items[ 0 ] )
			),
		} );

		const [ isCreatingPage, setIsCreatingPage ] = useState( false );
		const { saveEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function createPage( event: React.FormEvent ) {
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
				excerpt:
					typeof item.excerpt === 'string'
						? item.excerpt
						: item.excerpt?.raw,
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
			const assignableProperties = Object.keys( item?._links || {} )
				.filter( ( property ) =>
					property.startsWith( assignablePropertiesPrefix )
				)
				.map( ( property ) =>
					property.slice( assignablePropertiesPrefix.length )
				);
			assignableProperties.forEach( ( property ) => {
				if ( item.hasOwnProperty( property ) ) {
					// @ts-ignore
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
						decodeEntities( newItem.title?.rendered || item.title )
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
				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
						: __( 'An error occurred while duplicating the page.' );

				createErrorNotice( errorMessage, {
					type: 'snackbar',
				} );
			} finally {
				setIsCreatingPage( false );
				closeModal?.();
			}
		}

		return (
			<form onSubmit={ createPage }>
				<VStack spacing={ 3 }>
					<DataForm
						data={ item }
						fields={ fields }
						form={ formDuplicateAction }
						onChange={ ( changes ) =>
							setItem( ( prev ) => ( {
								...prev,
								...changes,
							} ) )
						}
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
};

export default duplicatePost;
