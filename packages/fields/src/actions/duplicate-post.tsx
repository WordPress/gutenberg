/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
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
import { titleField } from '../fields';
import type { BasePost, CoreDataError } from '../types';
import { getItemTitle } from './utils';

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
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item, setItem ] = useState< BasePost >( {
			...items[ 0 ],
			title: sprintf(
				/* translators: %s: Existing post title */
				_x( '%s (Copy)', 'post' ),
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

			const isTemplate =
				item.type === 'wp_template' ||
				item.type === 'wp_registered_template';

			const newItemObject = {
				status: isTemplate ? 'publish' : 'draft',
				title: item.title,
				slug: isTemplate ? item.slug : item.title || __( 'No title' ),
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
					newItemObject[ property ] = item[ property ];
				}
			} );
			setIsCreatingPage( true );
			try {
				const newItem = await saveEntityRecord(
					'postType',
					item.type === 'wp_registered_template'
						? 'wp_template'
						: item.type,
					newItemObject,
					{ throwOnError: true }
				);

				createSuccessNotice(
					sprintf(
						// translators: %s: Title of the created post, e.g: "Hello world".
						__( '"%s" successfully created.' ),
						getItemTitle( newItem )
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
					{ item.type === 'wp_registered_template' && (
						<div>
							{ __(
								'You are about to duplicate a bundled template. Changes will not be live until you activate the new template.'
							) }
						</div>
					) }
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

/**
 * Duplicate action for BasePost.
 */
export default duplicatePost;
