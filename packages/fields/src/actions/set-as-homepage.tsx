/**
 * WordPress dependencies
 */
import { select, useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Settings, Page } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	TextControl,
	SelectControl,
	Spinner,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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
		const siteSettings = _select( coreStore ).getEntityRecord< Settings >(
			'root',
			'site'
		);
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
			pageForPosts: siteSettings?.page_for_posts,
			showOnFront: siteSettings?.show_on_front,
		};
	} );

const SetAsHomepageModal: ActionModal< PostWithPermissions >[ 'RenderModal' ] =
	( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const pageTitle = getItemTitle( item );
		const pageId = item.id;
		const [ postsPageOption, setPostsPageOption ] = useState( 'none' );
		const [ existingPageId, setExistingPageId ] = useState( 0 );
		const [ postsPageTitle, setPostsPageTitle ] = useState( '' );
		const { currentHomePage, pageForPosts, showOnFront } =
			useSiteSettings();
		const currentHomePageTitle = getItemTitle( currentHomePage as Page );

		const { editEntityRecord, saveEditedEntityRecord, saveEntityRecord } =
			useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onSetPageAsHomepage( event: React.FormEvent ) {
			event.preventDefault();

			let newPage = {} as Page;

			try {
				// Create a new page for posts, if that action was selected.
				if ( postsPageOption === 'create-new' ) {
					newPage = await saveEntityRecord( 'postType', 'page', {
						title: postsPageTitle,
						status: 'publish',
					} );
				}

				// Set the existing page ID as the new page, if that action was selected.
				if ( postsPageOption === 'choose-existing' ) {
					newPage.id = existingPageId;
				}

				// Save new home page settings.
				await editEntityRecord( 'root', 'site', undefined, {
					page_for_posts: newPage?.id,
					page_on_front: item.id,
					show_on_front: 'page',
				} );

				closeModal?.();

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
				await editEntityRecord( 'root', 'site', undefined, {
					page_for_posts: 0,
					page_on_front: 0,
					show_on_front: 'posts',
				} );

				closeModal?.();

				await saveEditedEntityRecord( 'root', 'site', undefined, {
					page_for_posts: 0,
					page_on_front: 0,
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

		const listOfPages = useSelect( ( _select ) => {
			const pages: Page[] | null = _select( coreStore ).getEntityRecords(
				'postType',
				'page'
			);

			if ( ! pages ) {
				return [];
			}

			const formattedListOfPages = Object.values( pages )
				.map( ( page ) => ( {
					value: page.id.toString(),
					label: getItemTitle( page as Page ),
				} ) )
				.filter(
					( page ) => Number( page.value ) !== Number( pageId )
				);

			// Set the first page as the default selected page.
			if ( formattedListOfPages && existingPageId === 0 ) {
				setExistingPageId( Number( formattedListOfPages[ 0 ].value ) );
			}

			return formattedListOfPages;
		} );

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
								<ToggleGroupControl
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'Posts Page' ) }
									isBlock
									onChange={ ( value ) => {
										setPostsPageOption(
											value?.toString() || 'none'
										);
									} }
									help={ __(
										'Select how you want to create or select the page to display latest posts.'
									) }
									value={ postsPageOption || 'none' }
								>
									<ToggleGroupControlOption
										value="none"
										label={ __( 'None' ) }
									/>
									<ToggleGroupControlOption
										value="create-new"
										label={ __( 'Create new' ) }
									/>
									<ToggleGroupControlOption
										value="choose-existing"
										label={ __( 'Choose existing' ) }
									/>
								</ToggleGroupControl>
								{ postsPageOption === 'create-new' && (
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
								{ postsPageOption === 'choose-existing' && (
									<>
										{ listOfPages.length < 1 ? (
											<Spinner />
										) : (
											<SelectControl
												label={ __(
													'Select Posts Page'
												) }
												value={ existingPageId.toString() }
												options={ listOfPages }
												onChange={ ( value ) =>
													setExistingPageId(
														Number( value )
													)
												}
												__next40pxDefaultSize
												__nextHasNoMarginBottom
											/>
										) }
									</>
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
				// translators: %1$s: title of page to be set as the home page. %2$s: title of the current home page.
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

		// A front-page template overrides homepage settings, so don't show the action if it's present.
		const homepageTemplate =
			select( coreStore ).__experimentalGetTemplateForLink( '/' );

		if ( homepageTemplate && 'front-page' === homepageTemplate.slug ) {
			return false;
		}

		// Don't show the action if the page is already set as the homepage.
		const pageOnFront = select( coreStore ).getEntityRecord< Settings >(
			'root',
			'site'
		)?.page_on_front;

		if ( pageOnFront === post.id ) {
			return false;
		}

		return true;
	},
	RenderModal: SetAsHomepageModal,
};

export default setAsHomepage;
