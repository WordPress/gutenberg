/**
 * WordPress dependencies
 */
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import {
	__experimentalUseNavigator as useNavigator,
	Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';

import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import {
	isPreviewingTheme,
	currentlyPreviewingTheme,
} from '../../utils/is-previewing-theme';
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import NavigationMenuContent from '../sidebar-navigation-screen-navigation-menus/navigation-menu-content';
import ScreenNavigationMoreMenu from './more-menu';

const { useHistory } = unlock( routerPrivateApis );
const noop = () => {};

export default function SidebarNavigationScreenNavigationMenu() {
	const {
		deleteEntityRecord,
		saveEntityRecord,
		editEntityRecord,
		saveEditedEntityRecord,
	} = useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const postType = `wp_navigation`;
	const {
		goTo,
		params: { postId },
	} = useNavigator();

	const { record: navigationMenu, isResolving } = useEntityRecord(
		'postType',
		postType,
		postId
	);

	const { getEditedEntityRecord, isSaving, isDeleting } = useSelect(
		( select ) => {
			const {
				isSavingEntityRecord,
				isDeletingEntityRecord,
				getEditedEntityRecord: getEditedEntityRecordSelector,
			} = select( coreStore );

			return {
				isSaving: isSavingEntityRecord( 'postType', postType, postId ),
				isDeleting: isDeletingEntityRecord(
					'postType',
					postType,
					postId
				),
				getEditedEntityRecord: getEditedEntityRecordSelector,
			};
		},
		[ postId, postType ]
	);

	const isLoading = isResolving || isSaving || isDeleting;

	const menuTitle = navigationMenu?.title?.rendered || navigationMenu?.slug;

	const handleSave = async ( edits = {} ) => {
		// Prepare for revert in case of error.
		const originalRecord = getEditedEntityRecord(
			'postType',
			'wp_navigation',
			postId
		);

		// Apply the edits.
		editEntityRecord( 'postType', postType, postId, edits );

		// Attempt to persist.
		try {
			await saveEditedEntityRecord( 'postType', postType, postId, {
				throwOnError: true,
			} );
			createSuccessNotice( __( 'Renamed Navigation menu' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			// Revert to original in case of error.
			editEntityRecord( 'postType', postType, postId, originalRecord );

			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be renamed. */
					__( `Unable to rename Navigation menu (%s).` ),
					error?.message
				),

				{
					type: 'snackbar',
				}
			);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteEntityRecord(
				'postType',
				postType,
				postId,
				{
					force: true,
				},
				{
					throwOnError: true,
				}
			);
			createSuccessNotice( __( 'Deleted Navigation menu' ), {
				type: 'snackbar',
			} );
			goTo( '/navigation' );
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( `Unable to delete Navigation menu (%s).` ),
					error?.message
				),

				{
					type: 'snackbar',
				}
			);
		}
	};
	const handleDuplicate = async () => {
		try {
			const savedRecord = await saveEntityRecord(
				'postType',
				postType,
				{
					title: sprintf(
						/* translators: %s: Navigation menu title */
						__( '%s (Copy)' ),
						menuTitle
					),
					content: navigationMenu?.content?.raw,
					status: 'publish',
				},
				{
					throwOnError: true,
				}
			);

			if ( savedRecord ) {
				createSuccessNotice( __( 'Duplicated Navigation menu' ), {
					type: 'snackbar',
				} );
				goTo( `/navigation/${ postType }/${ savedRecord.id }` );
			}
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( `Unable to duplicate Navigation menu (%s).` ),
					error?.message
				),

				{
					type: 'snackbar',
				}
			);
		}
	};

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __(
					'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
				) }
			>
				<Spinner className="edit-site-sidebar-navigation-screen-navigation-menus__loading" />
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! navigationMenu ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __( 'Navigation Menu missing.' ) }
			/>
		);
	}

	if ( ! navigationMenu?.content?.raw ) {
		return (
			<SidebarNavigationScreenWrapper
				actions={
					<ScreenNavigationMoreMenu
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
				}
				title={ decodeEntities( menuTitle ) }
				description={ __( 'This Navigation Menu is empty.' ) }
			/>
		);
	}

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<ScreenNavigationMoreMenu
					menuTitle={ decodeEntities( menuTitle ) }
					onDelete={ handleDelete }
					onSave={ handleSave }
					onDuplicate={ handleDuplicate }
				/>
			}
			title={ decodeEntities( menuTitle ) }
			description={ __(
				'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
		>
			<NavigationMenuEditor navigationMenu={ navigationMenu } />
		</SidebarNavigationScreenWrapper>
	);
}

function NavigationMenuEditor( { navigationMenu } ) {
	const history = useHistory();

	const onSelect = useCallback(
		( selectedBlock ) => {
			const { attributes, name } = selectedBlock;
			if (
				attributes.kind === 'post-type' &&
				attributes.id &&
				attributes.type &&
				history
			) {
				history.push( {
					postType: attributes.type,
					postId: attributes.id,
					...( isPreviewingTheme() && {
						gutenberg_theme_preview: currentlyPreviewingTheme(),
					} ),
				} );
			}
			if ( name === 'core/page-list-item' && attributes.id && history ) {
				history.push( {
					postType: 'page',
					postId: attributes.id,
					...( isPreviewingTheme() && {
						gutenberg_theme_preview: currentlyPreviewingTheme(),
					} ),
				} );
			}
		},
		[ history ]
	);

	const { storedSettings } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		return {
			storedSettings: getSettings( false ),
		};
	}, [] );

	const blocks = useMemo( () => {
		if ( ! NavigationMenuEditor ) {
			return [];
		}

		return [
			createBlock( 'core/navigation', { ref: navigationMenu?.id } ),
		];
	}, [ navigationMenu ] );

	if ( ! navigationMenu || ! blocks?.length ) {
		return null;
	}

	return (
		<BlockEditorProvider
			settings={ storedSettings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<div className="edit-site-sidebar-navigation-screen-navigation-menus__content">
				<NavigationMenuContent
					rootClientId={ blocks[ 0 ].clientId }
					onSelect={ onSelect }
				/>
			</div>
		</BlockEditorProvider>
	);
}
