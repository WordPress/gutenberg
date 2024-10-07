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
	CheckboxControl,
	TextControl,
} from '@wordpress/components';
import type { Action, ActionModal } from '@wordpress/dataviews';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { getItemTitle } from './utils';
import type { CoreDataError, PostWithPermissions } from '../types';

const PAGE_POST_TYPE = 'page';

const useSiteSettings = () =>
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
			// @ts-ignore
			showOnFront: siteSettings?.show_on_front,
		};
	} );

const SetAsHomepageModal: ActionModal< PostWithPermissions >[ 'RenderModal' ] =
	( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const pageTitle = getItemTitle( item );
		const [ createPageForPosts, setCreatePageForPosts ] = useState( false );
		const [ postsPageTitle, setPostsPageTitle ] = useState( '' );
		// @ts-ignore
		const { currentHomePage, pageForPosts, showOnFront } =
			useSiteSettings();
		const currentHomePageTitle = getItemTitle( currentHomePage );

		const { editEntityRecord, saveEditedEntityRecord, saveEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onSetPageAsHomepage( event: React.FormEvent ) {
			event.preventDefault();

			let publishItem = false;
			let newPage;

			try {
				// Create a new page for posts, if that action was selected.
				if ( createPageForPosts ) {
					newPage = await saveEntityRecord( 'postType', 'page', {
						title: postsPageTitle,
						status: 'publish',
					} );
				}

				// Publish the page to become the homepage, if needed.
				if ( 'publish' !== item.status ) {
					await editEntityRecord( 'postType', item.type, item.id, {
						status: 'publish',
					} );
					publishItem = true;
				}

				// Save new home page settings.
				// @ts-ignore
				await editEntityRecord( 'root', 'site', undefined, {
					page_for_posts: newPage?.id,
					page_on_front: item.id,
					show_on_front: 'page',
				} );

				closeModal?.();

				// Persist changes.
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
					page_for_posts: newPage?.id,
					page_on_front: item.id,
					show_on_front: 'page',
				} );

				createSuccessNotice( __( 'Homepage updated' ), {
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

		const renderModalBody = () => {
			if ( 'posts' === showOnFront ) {
				return (
					<>
						<Text>
							{ sprintf(
								// translators: %s: title of the page to be set as the homepage.
								__(
									'Set "%s" as the site homepage? This will replace the current homepage which is set to display latest posts.'
								),
								pageTitle
							) }
						</Text>
						{ ! pageForPosts && (
							<>
								<CheckboxControl
									__nextHasNoMarginBottom
									label={ __(
										'Create a page to display latest posts'
									) }
									checked={ createPageForPosts }
									onChange={ ( value ) =>
										setCreatePageForPosts( value )
									}
								/>
								{ createPageForPosts && (
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Posts page title' ) }
										value={ postsPageTitle }
										onChange={ ( value ) =>
											setPostsPageTitle( value )
										}
									/>
								) }
							</>
						) }
					</>
				);
			} else if ( item.id === pageForPosts ) {
				return (
					<Text>
						{ sprintf(
							// translators: %s: title of the current home page.
							__(
								'Set the homepage to display latest posts? This will replace the current home page: "%s"'
							),
							currentHomePageTitle
						) }{ ' ' }
					</Text>
				);
			}

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

			return (
				<Text>
					{ sprintf(
						modalTranslatedString,
						pageTitle,
						currentHomePageTitle
					) }{ ' ' }
				</Text>
			);
		};

		const submitAction =
			showOnFront === 'posts' || item.id !== pageForPosts
				? onSetPageAsHomepage
				: onSetLatestPostsHomepage;

		return (
			<form onSubmit={ submitAction }>
				<VStack spacing="5">
					{ renderModalBody() }
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
							{
								// translators: Button to confirm setting the specified page as the homepage.
								__( 'Set homepage' )
							}
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	};

const setAsHomepage: Action< PostWithPermissions > = {
	id: 'set-as-homepage',
	label: __( 'Set as homepage' ),
	isEligible( post ) {
		if ( post.status !== 'publish' ) {
			return false;
		}

		if ( post.type !== PAGE_POST_TYPE ) {
			return false;
		}

		// A front-page tempalte overrides homepage settings, so don't show the action if it's present.
		const homepageTemplate =
			select( coreStore ).__experimentalGetTemplateForLink( '/' );

		if ( homepageTemplate && 'front-page' === homepageTemplate.slug ) {
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
	RenderModal: SetAsHomepageModal,
};

export default setAsHomepage;
