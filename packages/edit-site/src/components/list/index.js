/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { InterfaceSkeleton } from '@wordpress/interface';
import { __, sprintf } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { EditorSnackbars } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import useRegisterShortcuts from './use-register-shortcuts';
import Header from './header';
import NavigationSidebar from '../navigation-sidebar';
import Table from './table';
import { store as editSiteStore } from '../../store';
import { useLocation } from '../routes';
import useTitle from '../routes/use-title';

export default function List() {
	const {
		params: { postType: templateType },
	} = useLocation();

	useRegisterShortcuts();

	const { createErrorNotice } = useDispatch( noticesStore );

	const { previousShortcut, nextShortcut, isNavigationOpen } = useSelect(
		( select ) => {
			return {
				previousShortcut: select(
					keyboardShortcutsStore
				).getAllShortcutKeyCombinations(
					'core/edit-site/previous-region'
				),
				nextShortcut: select(
					keyboardShortcutsStore
				).getAllShortcutKeyCombinations( 'core/edit-site/next-region' ),
				isNavigationOpen: select( editSiteStore ).isNavigationOpened(),
			};
		},
		[]
	);

	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	useTitle( postType?.labels?.name );

	// `postType` could load in asynchronously. Only provide the detailed region labels if
	// the postType has loaded, otherwise `InterfaceSkeleton` will fallback to the defaults.
	const itemsListLabel = postType?.labels?.items_list;
	const detailedRegionLabels = postType
		? {
				header: sprintf(
					// translators: %s - the name of the page, 'Header' as in the header area of that page.
					__( '%s - Header' ),
					itemsListLabel
				),
				body: sprintf(
					// translators: %s - the name of the page, 'Content' as in the content area of that page.
					__( '%s - Content' ),
					itemsListLabel
				),
		  }
		: undefined;

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	return (
		<>
			<InterfaceSkeleton
				className={ classnames( 'edit-site-list', {
					'is-navigation-open': isNavigationOpen,
				} ) }
				labels={ {
					drawer: __( 'Navigation Sidebar' ),
					...detailedRegionLabels,
				} }
				header={ <Header templateType={ templateType } /> }
				drawer={ <NavigationSidebar.Slot /> }
				notices={ <EditorSnackbars /> }
				content={ <Table templateType={ templateType } /> }
				shortcuts={ {
					previous: previousShortcut,
					next: nextShortcut,
				} }
			/>
			<PluginArea onError={ onPluginAreaError } />
		</>
	);
}
