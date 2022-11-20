/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useRef, Fragment } from '@wordpress/element';
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
import {
	BlockList,
	BlockEditorProvider,
	__experimentalLinkControl,
	BlockInspector,
	BlockTools,
	__unstableBlockToolbarLastItem,
	__unstableBlockSettingsMenuFirstItem,
	__unstableUseTypingObserver as useTypingObserver,
	BlockEditorKeyboardShortcuts,
	store as blockEditorStore,
	__unstableBlockNameContext,
} from '@wordpress/block-editor';
import { useMergeRefs, useViewportMatch } from '@wordpress/compose';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { listView } from '@wordpress/icons';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as interfaceStore } from '@wordpress/interface';
import {
	getBlockType,
	getBlockFromExample,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar-edit-mode';
import { store as editSiteStore } from '../../store';
import BlockInspectorButton from './block-inspector-button';
import BackButton from './back-button';
import ResizableEditor from './resizable-editor';

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

/* @TEST */

function getGlobalStylesPreviewBlocks() {
	const group = getBlockType( 'core/group' );
	const heading = getBlockType( 'core/heading' );
	const columns = getBlockType( 'core/columns' );
	const separator = getBlockType( 'core/separator' );

	if (
		! group?.name ||
		! heading?.name ||
		! columns?.name ||
		! separator?.name
	) {
		return null;
	}

	const headings = [ 1, 2, 3, 4, 5, 6 ].map( ( level ) =>
		createBlock( heading?.name, {
			content: sprintf(
				/* translators: %s: The number to indicate a heading level, e.g., '1' in H1. */
				__( 'Heading H%s' ),
				level
			),
			level,
		} )
	);

	const columnsBlock = getBlockFromExample( columns?.name, columns?.example );
	const separatorBlock = getBlockFromExample(
		separator?.name,
		separator?.example
	);

	// const headingBlock = createBlock(
	// 	heading?.name,
	// 	heading?.example?.attributes,
	// 	heading?.example?.innerBlocks
	// );
	// const paragraphBlock = createBlock(
	// 	paragraph?.name,
	// 	paragraph?.example?.attributes,
	// 	paragraph?.example?.innerBlocks
	// );

	const blocks = createBlock( group?.name, {}, [
		...headings,
		separatorBlock,
		createBlock( heading?.name, {
			content: __( 'Columns block' ),
			level: 2,
		} ),
		columnsBlock,
		separatorBlock,
	] );

	return [ blocks ];
}

/* @TEST */

const NAVIGATION_SIDEBAR_NAME = 'edit-site/navigation-menu';

export default function BlockEditor( { setIsInserterOpen } ) {
	const {
		storedSettings,
		templateType,
		templateId,
		page,
		isNavigationSidebarOpen,
		isZoomOutMode,
		isGlobalStylesPreviewPageVisible,
	} = useSelect(
		( select ) => {
			const { getSettings, getEditedPostType, getEditedPostId, getPage } =
				select( editSiteStore );
			const {
				__unstableGetEditorMode,
				__unstableIsGlobalStylesPreviewPageVisible,
			} = select( blockEditorStore );
			return {
				storedSettings: getSettings( setIsInserterOpen ),
				templateType: getEditedPostType(),
				templateId: getEditedPostId(),
				page: getPage(),
				isNavigationSidebarOpen:
					select( interfaceStore ).getActiveComplementaryArea(
						editSiteStore.name
					) === NAVIGATION_SIDEBAR_NAME,
				isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
				isGlobalStylesPreviewPageVisible:
					__unstableIsGlobalStylesPreviewPageVisible() === true,
			};
		},
		[ setIsInserterOpen ]
	);
	const settingsBlockPatterns =
		storedSettings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		storedSettings.__experimentalBlockPatterns; // WP 5.9
	const settingsBlockPatternCategories =
		storedSettings.__experimentalAdditionalBlockPatternCategories ?? // WP 6.0
		storedSettings.__experimentalBlockPatternCategories; // WP 5.9

	const { restBlockPatterns, restBlockPatternCategories } = useSelect(
		( select ) => ( {
			restBlockPatterns: select( coreStore ).getBlockPatterns(),
			restBlockPatternCategories:
				select( coreStore ).getBlockPatternCategories(),
		} ),
		[]
	);

	const blockPatterns = useMemo(
		() =>
			[
				...( settingsBlockPatterns || [] ),
				...( restBlockPatterns || [] ),
			]
				.filter(
					( x, index, arr ) =>
						index === arr.findIndex( ( y ) => x.name === y.name )
				)
				.filter( ( { postTypes } ) => {
					return (
						! postTypes ||
						( Array.isArray( postTypes ) &&
							postTypes.includes( templateType ) )
					);
				} ),
		[ settingsBlockPatterns, restBlockPatterns, templateType ]
	);

	const blockPatternCategories = useMemo(
		() =>
			[
				...( settingsBlockPatternCategories || [] ),
				...( restBlockPatternCategories || [] ),
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ settingsBlockPatternCategories, restBlockPatternCategories ]
	);

	const settings = useMemo( () => {
		const {
			__experimentalAdditionalBlockPatterns,
			__experimentalAdditionalBlockPatternCategories,
			...restStoredSettings
		} = storedSettings;

		return {
			...restStoredSettings,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
		};
	}, [ storedSettings, blockPatterns, blockPatternCategories ] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const { setPage } = useDispatch( editSiteStore );
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	const toggleNavigationSidebar = useCallback( () => {
		const toggleComplementaryArea = isNavigationSidebarOpen
			? disableComplementaryArea
			: enableComplementaryArea;
		toggleComplementaryArea( editSiteStore.name, NAVIGATION_SIDEBAR_NAME );
	}, [ isNavigationSidebarOpen ] );
	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [ contentRef, useTypingObserver() ] );
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const isTemplatePart = templateType === 'wp_template_part';
	const hasBlocks = blocks.length !== 0;

	const NavMenuSidebarToggle = () => (
		<ToolbarGroup>
			<ToolbarButton
				className="components-toolbar__control"
				label={
					isNavigationSidebarOpen
						? __( 'Close list view' )
						: __( 'Open list view' )
				}
				onClick={ toggleNavigationSidebar }
				icon={ listView }
				isActive={ isNavigationSidebarOpen }
			/>
		</ToolbarGroup>
	);

	// Conditionally include NavMenu sidebar in Plugin only.
	// Optimise for dead code elimination.
	// See https://github.com/WordPress/gutenberg/blob/trunk/docs/how-to-guides/feature-flags.md#dead-code-elimination.
	let MaybeNavMenuSidebarToggle = Fragment;

	if ( process.env.IS_GUTENBERG_PLUGIN ) {
		MaybeNavMenuSidebarToggle = NavMenuSidebarToggle;
	}

	return (
		<BlockEditorProvider
			settings={ settings }
			value={
				isGlobalStylesPreviewPageVisible && isZoomOutMode
					? getGlobalStylesPreviewBlocks()
					: blocks
			}
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<TemplatePartConverter />
			<__experimentalLinkControl.ViewerFill>
				{ useCallback(
					( fillProps ) => (
						<NavigateToLink
							{ ...fillProps }
							activePage={ page }
							onActivePageChange={ setPage }
						/>
					),
					[ page ]
				) }
			</__experimentalLinkControl.ViewerFill>
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			<BlockTools
				className={ classnames( 'edit-site-visual-editor', {
					'is-focus-mode': isTemplatePart,
				} ) }
				__unstableContentRef={ contentRef }
				onClick={ ( event ) => {
					// Clear selected block when clicking on the gray background.
					if ( event.target === event.currentTarget ) {
						clearSelectedBlock();
					}
				} }
			>
				<BlockEditorKeyboardShortcuts.Register />
				<BackButton />
				<ResizableEditor
					// Reinitialize the editor and reset the states when the template changes.
					key={ templateId }
					enableResizing={
						isTemplatePart &&
						// Disable resizing in mobile viewport.
						! isMobileViewport
					}
					settings={ settings }
					contentRef={ mergedRefs }
				>
					<BlockList
						className="edit-site-block-editor__block-list wp-site-blocks"
						__experimentalLayout={ LAYOUT }
						renderAppender={
							isTemplatePart && hasBlocks ? false : undefined
						}
					/>
				</ResizableEditor>
				<__unstableBlockSettingsMenuFirstItem>
					{ ( { onClose } ) => (
						<BlockInspectorButton onClick={ onClose } />
					) }
				</__unstableBlockSettingsMenuFirstItem>
				<__unstableBlockToolbarLastItem>
					<__unstableBlockNameContext.Consumer>
						{ ( blockName ) =>
							blockName === 'core/navigation' && (
								<MaybeNavMenuSidebarToggle />
							)
						}
					</__unstableBlockNameContext.Consumer>
				</__unstableBlockToolbarLastItem>
			</BlockTools>
			<ReusableBlocksMenuItems />
		</BlockEditorProvider>
	);
}
