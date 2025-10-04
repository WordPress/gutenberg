/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { getItemTitle } from '../../utils/get-item-title';

const SetAsPostsPageModal = ( { items, closeModal } ) => {
	const [ item ] = items;
	const pageTitle = getItemTitle( item );
	const { currentPostsPage, isPageForPostsSet, isSaving } = useSelect(
		( select ) => {
			const { getEntityRecord, isSavingEntityRecord } =
				select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const currentPostsPageItem = getEntityRecord(
				'postType',
				'page',
				siteSettings?.page_for_posts
			);
			return {
				currentPostsPage: currentPostsPageItem,
				isPageForPostsSet: siteSettings?.page_for_posts !== 0,
				isSaving: isSavingEntityRecord( 'root', 'site' ),
			};
		}
	);

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onSetPageAsPostsPage( event ) {
		event.preventDefault();

		try {
			await saveEntityRecord( 'root', 'site', {
				page_for_posts: item.id,
				show_on_front: 'page',
			} );

			createSuccessNotice( __( 'Posts page updated.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while setting the posts page.' );
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
					getItemTitle( currentPostsPage )
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
				<Text>{ modalText }</Text>
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
};

export const useSetAsPostsPageAction = () => {
	const { pageOnFront, pageForPosts } = useSelect( ( select ) => {
		const { getEntityRecord, canUser } = select( coreStore );
		const siteSettings = canUser( 'read', {
			kind: 'root',
			name: 'site',
		} )
			? getEntityRecord( 'root', 'site' )
			: undefined;

		return {
			pageOnFront: siteSettings?.page_on_front,
			pageForPosts: siteSettings?.page_for_posts,
		};
	} );

	return useMemo(
		() => ( {
			id: 'set-as-posts-page',
			label: __( 'Set as posts page' ),
			isEligible( post ) {
				if ( post.status !== 'publish' ) {
					return false;
				}

				if ( post.type !== 'page' ) {
					return false;
				}

				// Don't show the action if the page is already set as the homepage.
				if ( pageOnFront === post.id ) {
					return false;
				}

				// Don't show the action if the page is already set as the page for posts.
				if ( pageForPosts === post.id ) {
					return false;
				}

				return true;
			},
			modalFocusOnMount: 'firstContentElement',
			RenderModal: SetAsPostsPageModal,
		} ),
		[ pageForPosts, pageOnFront ]
	);
};
