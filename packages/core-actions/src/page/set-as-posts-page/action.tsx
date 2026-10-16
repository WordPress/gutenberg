import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalText as WCText,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Settings } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { getItemTitle } from '../../shared/utils';
import { hasActionLink } from '../../shared/has-action-link';
import { refetchPages } from '../../shared/refetch-pages';
import type {
	BasePost,
	CoreDataError,
	ActionScriptParts,
} from '../../shared/types';

const setAsPostsPage: ActionScriptParts< BasePost > = {
	isEligible( post ) {
		// The server adds the link to the published pages the user can set as
		// the posts page, which are neither the homepage nor the posts page.
		// The status is checked too, as the editor shows the actions of the
		// edited page.
		return (
			post.status === 'publish' &&
			hasActionLink( post, 'wp:action-set-posts-page' )
		);
	},
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const pageTitle = getItemTitle( item, '' );
		const { pageForPosts, currentPostsPage, isPageForPostsSet, isSaving } =
			useSelect( ( select ) => {
				const { getEntityRecord, isSavingEntityRecord } =
					select( coreStore );
				const siteSettings = getEntityRecord(
					'root',
					'site'
				) as Partial< Settings >;
				const currentPostsPageItem = getEntityRecord(
					'postType',
					'page',
					siteSettings?.page_for_posts
				) as BasePost | undefined;
				return {
					pageForPosts: siteSettings?.page_for_posts,
					currentPostsPage: currentPostsPageItem,
					isPageForPostsSet: siteSettings?.page_for_posts !== 0,
					isSaving: isSavingEntityRecord( 'root', 'site' ),
				};
			}, [] );

		const registry = useRegistry();
		const { saveEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		async function onSetPageAsPostsPage( event: React.FormEvent ) {
			event.preventDefault();

			try {
				await saveEntityRecord( 'root', 'site', {
					page_for_posts: item.id,
					show_on_front: 'page',
				} );

				// The action links of the pages depend on the posts page, so
				// the new posts page and the previous one are requested again.
				await refetchPages( registry, [ item.id, pageForPosts ] );

				createSuccessNotice( __( 'Posts page updated.' ), {
					type: 'snackbar',
				} );
			} catch ( error ) {
				const typedError = error as CoreDataError;
				const errorMessage =
					typedError.message && typedError.code !== 'unknown_error'
						? typedError.message
						: __(
								'An error occurred while setting the posts page.'
							);
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			} finally {
				closeModal?.();
			}
		}

		const modalWarning =
			isPageForPostsSet && currentPostsPage
				? sprintf(
						// translators: %s: title of the current posts page.
						__( 'This will replace the current posts page: "%s"' ),
						getItemTitle( currentPostsPage, '' )
					)
				: __( 'This page will show the latest posts.' );

		const modalText = sprintf(
			// translators: %1$s: title of the page to be set as the posts page, %2$s: posts page replacement warning message.
			__( 'Set "%1$s" as the posts page? %2$s' ),
			pageTitle,
			modalWarning
		);

		// translators: Button label to confirm setting the specified page as the posts page.
		const modalButtonLabel = __( 'Set posts page' );

		return (
			<form onSubmit={ onSetPageAsPostsPage }>
				<VStack spacing="5">
					<WCText>{ modalText }</WCText>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => {
								closeModal?.();
							} }
							disabled={ isSaving }
							accessibleWhenDisabled
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							disabled={ isSaving }
							accessibleWhenDisabled
						>
							{ modalButtonLabel }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};

/**
 * The JavaScript parts of the action setting a page as the posts page; its
 * data is in `action.php`.
 */
export default setAsPostsPage;
