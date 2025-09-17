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

const SetAsHomepageModal = ( { items, closeModal } ) => {
	const [ item ] = items;
	const pageTitle = getItemTitle( item );
	const { showOnFront, currentHomePage, isSaving } = useSelect(
		( select ) => {
			const { getEntityRecord, isSavingEntityRecord } =
				select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const currentHomePageItem = getEntityRecord(
				'postType',
				'page',
				siteSettings?.page_on_front
			);
			return {
				showOnFront: siteSettings?.show_on_front,
				currentHomePage: currentHomePageItem,
				isSaving: isSavingEntityRecord( 'root', 'site' ),
			};
		}
	);

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onSetPageAsHomepage( event ) {
		event.preventDefault();

		try {
			await saveEntityRecord( 'root', 'site', {
				page_on_front: item.id,
				show_on_front: 'page',
			} );

			createSuccessNotice( __( 'Homepage updated.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while setting the homepage.' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		} finally {
			closeModal?.();
		}
	}

	let modalWarning = '';
	if ( 'posts' === showOnFront ) {
		modalWarning = __(
			'This will replace the current homepage which is set to display latest posts.'
		);
	} else if ( currentHomePage ) {
		modalWarning = sprintf(
			// translators: %s: title of the current home page.
			__( 'This will replace the current homepage: "%s"' ),
			getItemTitle( currentHomePage )
		);
	}

	const modalText = sprintf(
		// translators: %1$s: title of the page to be set as the homepage, %2$s: homepage replacement warning message.
		__( 'Set "%1$s" as the site homepage? %2$s' ),
		pageTitle,
		modalWarning
	).trim();

	// translators: Button label to confirm setting the specified page as the homepage.
	const modalButtonLabel = __( 'Set homepage' );

	return (
		<form onSubmit={ onSetPageAsHomepage }>
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

export const useSetAsHomepageAction = () => {
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
			id: 'set-as-homepage',
			label: __( 'Set as homepage' ),
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
			RenderModal: SetAsHomepageModal,
		} ),
		[ pageForPosts, pageOnFront ]
	);
};
