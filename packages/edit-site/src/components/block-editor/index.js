/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
import {
	BlockList,
	BlockInspector,
	BlockTools,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	BlockEditorKeyboardShortcuts,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	useMergeRefs,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import inserterMediaCategories from './inserter-media-categories';
import TemplatePartConverter from '../template-part-converter';
import { SidebarInspectorFill } from '../sidebar-edit-mode';
import { store as editSiteStore } from '../../store';
import BackButton from './back-button';
import ResizableEditor from './resizable-editor';
import EditorCanvas from './editor-canvas';
import { unlock } from '../../lock-unlock';
import EditorCanvasContainer from '../editor-canvas-container';
import {
	DisableNonPageContentBlocks,
	usePageContentFocusNotifications,
} from '../page-content-focus';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

export default function BlockEditor() {
	const { setIsInserterOpened } = useDispatch( editSiteStore );
	const { storedSettings, templateType, canvasMode, hasPageContentFocus } =
		useSelect(
			( select ) => {
				const {
					getSettings,
					getEditedPostType,
					getCanvasMode,
					hasPageContentFocus: _hasPageContentFocus,
				} = unlock( select( editSiteStore ) );

				return {
					storedSettings: getSettings( setIsInserterOpened ),
					templateType: getEditedPostType(),
					canvasMode: getCanvasMode(),
					hasPageContentFocus: _hasPageContentFocus(),
				};
			},
			[ setIsInserterOpened ]
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
			inserterMediaCategories,
			__experimentalBlockPatterns: blockPatterns,
			__experimentalBlockPatternCategories: blockPatternCategories,
		};
	}, [ storedSettings, blockPatterns, blockPatternCategories ] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [
		contentRef,
		useClipboardHandler(),
		useTypingObserver(),
		usePageContentFocusNotifications(),
	] );
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

	return (
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			{ hasPageContentFocus && <DisableNonPageContentBlocks /> }
			<TemplatePartConverter />
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			<EditorCanvasContainer.Slot>
				{ ( [ editorCanvasView ] ) =>
					editorCanvasView ? (
						<div className="edit-site-visual-editor is-focus-mode">
							{ editorCanvasView }
						</div>
					) : (
						<BlockTools
							className={ classnames( 'edit-site-visual-editor', {
								'is-focus-mode':
									isTemplatePart || !! editorCanvasView,
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
								height={ sizes.height ?? '100%' }
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
						</BlockTools>
					)
				}
			</EditorCanvasContainer.Slot>
			<ReusableBlocksMenuItems />
		</ExperimentalBlockEditorProvider>
	);
}
