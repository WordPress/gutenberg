import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalText as WCText,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Settings } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import type { RenderModalProps } from '@wordpress/dataviews';
import { getItemTitle } from '../../shared/utils';
import type {
	BasePost,
	CoreDataError,
	ActionScriptParts,
} from '../../shared/types';
import { isEligibleForHomepageActions } from '../utils';

const SetAsPostsPageModal = ( {
	items,
	closeModal,
}: RenderModalProps< BasePost > ) => {
	const [ item ] = items;
	const pageTitle = getItemTitle( item );
	const { currentPostsPage, isPageForPostsSet, isSaving } = useSelect(
		( select ) => {
			const { getEntityRecord, isSavingEntityRecord } =
				select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' ) as
				Partial< Settings > | undefined;
			const currentPostsPageItem = getEntityRecord(
				'postType',
				'page',
				siteSettings?.page_for_posts
			) as BasePost | undefined;
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

	async function onSetPageAsPostsPage( event: React.FormEvent ) {
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
			const typedError = error as CoreDataError;
			const errorMessage =
				typedError.message && typedError.code !== 'unknown_error'
					? typedError.message
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
};

const setAsPostsPage: ActionScriptParts< BasePost > = {
	isEligible: isEligibleForHomepageActions,
	RenderModal: SetAsPostsPageModal,
};

/**
 * The JavaScript parts of the set as posts page action for pages; its data is
 * in `action.php`.
 */
export default setAsPostsPage;
