/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useRef, Fragment } from '@wordpress/element';
import {
	useEntityBlockEditor,
	__experimentalFetchMedia as fetchMedia,
	store as coreStore,
} from '@wordpress/core-data';
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
import {
	useMergeRefs,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';
import { listView } from '@wordpress/icons';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
import EditorCanvas from './editor-canvas';
import StyleBook from '../style-book';

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

export default function BlockEditor( { setIsInserterOpen } ) {
	const { storedSettings, templateType, canvasMode } = useSelect(
		( select ) => {
			const { getSettings, getEditedPostType, __unstableGetCanvasMode } =
				select( editSiteStore );

			return {
				storedSettings: getSettings( setIsInserterOpen ),
				templateType: getEditedPostType(),
				canvasMode: __unstableGetCanvasMode(),
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
			__unstableFetchMedia: fetchMedia,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
		};
	}, [ storedSettings, blockPatterns, blockPatternCategories ] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const { setPage } = useDispatch( editSiteStore );

	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [ contentRef, useTypingObserver() ] );
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const [ resizeObserver, sizes ] = useResizeObserver();

	const isTemplatePart = templateType === 'wp_template_part';
	const hasBlocks = blocks.length !== 0;
	const enableResizing =
		isTemplatePart &&
		canvasMode !== 'view' &&
		// Disable resizing in mobile viewport.
		! isMobileViewport;
	const isViewMode = canvasMode === 'view';
	const showBlockAppender =
		( isTemplatePart && hasBlocks ) || isViewMode ? false : undefined;

	// eslint-disable-next-line @wordpress/data-no-store-string-literals
	const { enableComplementaryArea } = useDispatch( 'core/interface' );

	const NavMenuSidebarToggle = () => (
		<ToolbarGroup>
			<ToolbarButton
				className="components-toolbar__control"
				label={ __( 'Open navigation list view' ) }
				onClick={ () =>
					enableComplementaryArea(
						'core/edit-site',
						'edit-site/block-inspector'
					)
				}
				icon={ listView }
			/>
		</ToolbarGroup>
	);

	let MaybeNavMenuSidebarToggle = Fragment;
	const isOffCanvasNavigationEditorEnabled =
		window?.__experimentalEnableOffCanvasNavigationEditor === true;

	if ( isOffCanvasNavigationEditorEnabled ) {
		MaybeNavMenuSidebarToggle = NavMenuSidebarToggle;
	}

	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
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
							onActivePageChange={ setPage }
						/>
					),
					[]
				) }
			</__experimentalLinkControl.ViewerFill>
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			{ /* Potentially this could be a generic slot (e.g. EditorCanvas.Slot) if there are other uses for it. */ }
			<StyleBook.Slot>
				{ ( [ styleBook ] ) =>
					styleBook ? (
						<div className="edit-site-visual-editor is-focus-mode">
							<ResizableEditor enableResizing>
								{ styleBook }
							</ResizableEditor>
						</div>
					) : (
						<BlockTools
							className={ classnames( 'edit-site-visual-editor', {
								'is-focus-mode': isTemplatePart || !! styleBook,
								'is-view-mode': isViewMode,
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
								enableResizing={ enableResizing }
								height={ sizes.height }
							>
								<EditorCanvas
									enableResizing={ enableResizing }
									settings={ settings }
									contentRef={ mergedRefs }
									readonly={ canvasMode === 'view' }
								>
									{ resizeObserver }
									<BlockList
										className="edit-site-block-editor__block-list wp-site-blocks"
										__experimentalLayout={ LAYOUT }
										renderAppender={ showBlockAppender }
									/>
								</EditorCanvas>
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
					)
				}
			</StyleBook.Slot>
			<ReusableBlocksMenuItems />
		</BlockEditorProvider>
	);
}
