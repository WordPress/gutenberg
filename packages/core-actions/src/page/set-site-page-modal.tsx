import {
	Button,
	__experimentalText as WCText,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Settings } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getItemTitle } from '../shared/utils';
import type { BasePost, CoreDataError } from '../shared/types';
import { refetchPages } from './refetch-pages';

export interface SetSitePageModalProps {
	/**
	 * The site setting the page is assigned to: the homepage or the posts
	 * page.
	 */
	setting: 'page_on_front' | 'page_for_posts';
	/**
	 * The items of the action: the page to assign.
	 */
	items: BasePost[];
	closeModal?: () => void;
	/**
	 * Returns the question of the modal, from the title of the page, the page
	 * the setting holds now, if any, and the site settings.
	 */
	getText: ( context: {
		pageTitle: string;
		currentPage?: BasePost;
		siteSettings?: Partial< Settings >;
	} ) => string;
	/**
	 * The label of the button confirming the change.
	 */
	submitLabel: string;
	/**
	 * The notice shown once the setting is saved.
	 */
	successNotice: string;
	/**
	 * The notice shown when saving the setting fails without a message of
	 * its own.
	 */
	errorNotice: string;
}

/**
 * The modal of the actions assigning a page to a site setting, the homepage
 * or the posts page: it asks for confirmation, saves the setting, and
 * requests the pages whose action links depend on the setting again.
 */
export function SetSitePageModal( {
	setting,
	items,
	closeModal,
	getText,
	submitLabel,
	successNotice,
	errorNotice,
}: SetSitePageModalProps ) {
	const [ item ] = items;
	const { siteSettings, currentPage, isSaving } = useSelect(
		( select ) => {
			const { getEntityRecord, isSavingEntityRecord } =
				select( coreStore );
			const settings = getEntityRecord( 'root', 'site' ) as
				Partial< Settings > | undefined;
			const currentId = settings?.[ setting ];
			return {
				siteSettings: settings,
				// A setting holding no page is `0`, and `getEntityRecord()`
				// without a key would request the whole collection.
				currentPage: currentId
					? ( getEntityRecord( 'postType', 'page', currentId ) as
							BasePost | undefined )
					: undefined,
				isSaving: isSavingEntityRecord( 'root', 'site' ),
			};
		},
		[ setting ]
	);

	const registry = useRegistry();
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function onSubmit( event: React.FormEvent ) {
		event.preventDefault();
		const previousId = siteSettings?.[ setting ];

		try {
			// Without `throwOnError`, a failed save resolves with `undefined`
			// and the success notice would show.
			await saveEntityRecord(
				'root',
				'site',
				{ [ setting ]: item.id, show_on_front: 'page' },
				{ throwOnError: true }
			);
		} catch ( error ) {
			const typedError = error as CoreDataError;
			const errorMessage =
				typedError.message && typedError.code !== 'unknown_error'
					? typedError.message
					: errorNotice;
			createErrorNotice( errorMessage, { type: 'snackbar' } );
			closeModal?.();
			return;
		}

		createSuccessNotice( successNotice, { type: 'snackbar' } );
		closeModal?.();

		// The action links of the pages depend on the setting, so the new
		// page and the previous one are requested again, once the modal is
		// closed: the setting is saved whether or not the request succeeds.
		try {
			await refetchPages( registry, [ item.id, previousId ] );
		} catch {
			// The links of the pages stay as they were until the next load.
		}
	}

	return (
		<form onSubmit={ onSubmit }>
			<VStack spacing="5">
				<WCText>
					{ getText( {
						pageTitle: getItemTitle( item, '' ),
						currentPage,
						siteSettings,
					} ) }
				</WCText>
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
						{ submitLabel }
					</Button>
				</HStack>
			</VStack>
		</form>
	);
}
