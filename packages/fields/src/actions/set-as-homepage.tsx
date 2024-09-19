/**
 * WordPress dependencies
 */
import { select, useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
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

		// A front-page tempalte overrides homepage settings, so don't show the action if it's present.
		const homepageTemplateSlug =
			select( coreStore ).__experimentalGetTemplateForLink( '/' )?.slug;

		if ( 'front-page' === homepageTemplateSlug ) {
			return false;
		}

		// Don't show the action if the page is already set as the homepage.
		const pageOnFront = select(
			coreStore
			// @ts-ignore
		).getEntityRecord( 'root', 'site' )?.page_on_front;

		if ( pageOnFront === post.id ) {
			return false;
		}

		return true;
	},
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const [ title ] = useState( () => getItemTitle( item ) );
		const { currentHomePage, pageForPosts, pageOnFront, showOnFront } =
			// @ts-ignore
			useSelect( ( _select ) => {
				// @ts-ignore
				const siteSettings = _select( coreStore ).getEntityRecord(
					'root',
					'site'
				);
				// @ts-ignore
				const _pageOnFront = siteSettings?.page_on_front || null;
				const _currentHomePage =
					_pageOnFront &&
					_select( coreStore ).getEntityRecord(
						'postType',
						'page',
						_pageOnFront
					);

				return {
					currentHomePage: _currentHomePage,
					// @ts-ignore
					pageForPosts: siteSettings?.page_for_posts,
					pageOnFront: _pageOnFront,
					// @ts-ignore
					showOnFront: siteSettings?.showOnFront,
				};
			} );
		const { editEntityRecord, saveEditedEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onSetAsHomepage( event: React.FormEvent ) {
			event.preventDefault();
			let publishItem = false;
			try {
				if ( 'publish' !== item.status ) {
					await editEntityRecord( 'postType', item.type, item.id, {
						status: 'publish',
					} );
					publishItem = true;
				}
				// @ts-ignore
				await editEntityRecord( 'root', 'site', undefined, {
					page_on_front: item.id,
				} );
				closeModal?.();
				// Persist edited entities.
				if ( publishItem ) {
					await saveEditedEntityRecord(
						'postType',
						item.type,
						item.id,
						{
							status: 'publish',
						}
					);
				}
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
						: __( 'An error occurred while setting the homepage' );
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}

		async function onSetLatestPostsHomepage( event: React.FormEvent ) {
			event.preventDefault();

			try {
				// @ts-ignore
				await editEntityRecord( 'root', 'site', undefined, {
					show_on_front: 'posts',
				} );

				closeModal?.();

				await saveEditedEntityRecord( 'root', 'site', undefined, {
					show_on_front: 'posts',
				} );

				createSuccessNotice(
					__( 'Homepage set to display latest posts' ),
					{
						type: 'snackbar',
					}
				);
				onActionPerformed?.( items );
			} catch ( error ) {
				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
						: __(
								'An error occurred while setting the homepage to display latest posts'
						  );
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}
		const currentHomePageTitle = getItemTitle( currentHomePage );

		let modalDescription;
		let submitAction;

		if ( item.id === pageForPosts ) {
			modalDescription = sprintf(
				// translators: %s: title of the current home page.
				__(
					'Set the homepage to display the latest posts? This will replace the current home page: "%s"'
				),
				currentHomePageTitle
			);
			submitAction = onSetLatestPostsHomepage;
		} else {
			const modalTranslatedString =
				'publish' !== item.status
					? // translators: %1$s: title of a unpublished page to be set as the home page. %2$s: title of the current home page.
					  __(
							'The page "%1$s" is not published. Set it as the site homepage? This will publish the page and replace the current homepage: "%2$s"'
					  )
					: // translators: %1$s: title of page to be set as the home page. %2$s: title of the current home page.
					  __(
							'Set "%1$s" as the site homepage? This will replace the current homepage: "%2$s"'
					  );

			modalDescription = sprintf(
				modalTranslatedString,
				title,
				currentHomePageTitle
			);
			submitAction = onSetAsHomepage;
		}

		return (
			<form onSubmit={ submitAction }>
				<VStack spacing="5">
					<Text>{ modalDescription }</Text>
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
							{ __( 'Confirm' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

export default renamePost;
