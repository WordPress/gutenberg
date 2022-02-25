/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Notice } from '@wordpress/components';
import { EntityProvider, store as coreStore } from '@wordpress/core-data';
import { BlockContextProvider, BlockBreadcrumb } from '@wordpress/block-editor';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import { EditorNotices } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../header';
import { SidebarComplementaryAreaFills } from '../sidebar';
import BlockEditor from '../block-editor';
import CodeEditor from '../code-editor';
import KeyboardShortcuts from '../keyboard-shortcuts';
import useURLQueryController from './use-url-query-controller';
import InserterSidebar from '../secondary-sidebar/inserter-sidebar';
import ListViewSidebar from '../secondary-sidebar/list-view-sidebar';
import ErrorBoundary from '../error-boundary';
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from './global-styles-renderer';
import useTitle from '../routes/use-title';
import Layout from '../layout';
import EditorActions from './actions';

const interfaceLabels = {
	secondarySidebar: __( 'Block Library' ),
	drawer: __( 'Navigation Sidebar' ),
};
function Editor( { onError } ) {
	const {
		settings,
		entityId,
		templateType,
		page,
		template,
		templateResolved,
		editorMode,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getEditedPostType,
			getEditedPostId,
			getPage,
			getEditorMode,
		} = select( editSiteStore );
		const { hasFinishedResolution, getEntityRecord } = select( coreStore );
		const postType = getEditedPostType();
		const postId = getEditedPostId();

		// The currently selected entity to display. Typically template or template part.
		return {
			settings: getSettings(),
			templateType: postType,
			page: getPage(),
			template: postId
				? getEntityRecord( 'postType', postType, postId )
				: null,
			templateResolved: postId
				? hasFinishedResolution( 'getEntityRecord', [
						'postType',
						postType,
						postId,
				  ] )
				: false,
			entityId: postId,
			editorMode: getEditorMode(),
		};
	}, [] );
	const { setPage, setIsInserterOpened } = useDispatch( editSiteStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const blockContext = useMemo(
		() => ( {
			...page?.context,
			queryContext: [
				page?.context.queryContext || { page: 1 },
				( newQueryContext ) =>
					setPage( {
						...page,
						context: {
							...page?.context,
							queryContext: {
								...page?.context.queryContext,
								...newQueryContext,
							},
						},
					} ),
			],
		} ),
		[ page?.context ]
	);

	useEffect(
		function openGlobalStylesOnLoad() {
			const searchParams = new URLSearchParams( window.location.search );
			if ( searchParams.get( 'styles' ) === 'open' ) {
				enableComplementaryArea(
					'core/edit-site',
					'edit-site/global-styles'
				);
			}
		},
		[ enableComplementaryArea ]
	);

	// Don't render the Editor until the settings are set and loaded.
	const isReady =
		settings?.siteUrl &&
		templateType !== undefined &&
		entityId !== undefined;

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in useURlQueryController from double-announcing.
	useTitle( isReady && __( 'Editor (beta)' ) );

	useURLQueryController();

	if ( ! isReady ) {
		return null;
	}

	return (
		<EntityProvider kind="root" type="site">
			<EntityProvider
				kind="postType"
				type={ templateType }
				id={ entityId }
			>
				<BlockContextProvider value={ blockContext }>
					<GlobalStylesRenderer />
					<ErrorBoundary onError={ onError }>
						<KeyboardShortcuts.Register />
						<SidebarComplementaryAreaFills />
						<EditorNotices />
						{ editorMode === 'visual' && template && (
							<BlockEditor
								setIsInserterOpen={ setIsInserterOpened }
							/>
						) }
						{ editorMode === 'text' && template && <CodeEditor /> }
						{ templateResolved &&
							! template &&
							settings?.siteUrl &&
							entityId && (
								<Notice
									status="warning"
									isDismissible={ false }
								>
									{ __(
										"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
									) }
								</Notice>
							) }
						<KeyboardShortcuts />
					</ErrorBoundary>
				</BlockContextProvider>
			</EntityProvider>
		</EntityProvider>
	);
}

Editor.renderLayout = function renderEditorLayout( {
	sidebarIsOpened,
	isInserterOpen,
	isListViewOpen,
	reboot,
} ) {
	let secondarySidebar = null;
	if ( isInserterOpen ) {
		secondarySidebar = <InserterSidebar />;
	} else if ( isListViewOpen ) {
		secondarySidebar = <ListViewSidebar />;
	}

	return (
		<Layout
			labels={ interfaceLabels }
			sidebar={
				sidebarIsOpened && (
					<ComplementaryArea.Slot scope="core/edit-site" />
				)
			}
			secondarySidebar={ secondarySidebar }
			header={ <Header /> }
			content={ <Editor onError={ reboot } /> }
			actions={ <EditorActions /> }
			footer={ <BlockBreadcrumb rootLabelText={ __( 'Template' ) } /> }
		>
			<WelcomeGuide />
		</Layout>
	);
};

export default Editor;
