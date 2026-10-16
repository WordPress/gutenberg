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

const SetAsHomepageModal = ( {
	items,
	closeModal,
}: RenderModalProps< BasePost > ) => {
	const [ item ] = items;
	const pageTitle = getItemTitle( item );
	const { showOnFront, currentHomePage, isSaving } = useSelect(
		( select ) => {
			const { getEntityRecord, isSavingEntityRecord } =
				select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' ) as
				Partial< Settings > | undefined;
			const currentHomePageItem = getEntityRecord(
				'postType',
				'page',
				siteSettings?.page_on_front
			) as BasePost | undefined;
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

	async function onSetPageAsHomepage( event: React.FormEvent ) {
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
			const typedError = error as CoreDataError;
			const errorMessage =
				typedError.message && typedError.code !== 'unknown_error'
					? typedError.message
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

const setAsHomepage: ActionScriptParts< BasePost > = {
	isEligible: isEligibleForHomepageActions,
	RenderModal: SetAsHomepageModal,
};

/**
 * The JavaScript parts of the set as homepage action for pages; its data is
 * in `action.php`.
 */
export default setAsHomepage;
