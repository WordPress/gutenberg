/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockList,
	BlockEditorProvider,
	__experimentalLinkControl,
	BlockInspector,
	BlockTools,
	__unstableBlockSettingsMenuFirstItem,
	__unstableUseTypingObserver as useTypingObserver,
	BlockEditorKeyboardShortcuts,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useMergeRefs, useViewportMatch } from '@wordpress/compose';
import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';
import { store as editSiteStore } from '../../store';
import BlockInspectorButton from './block-inspector-button';
import EditTemplatePartMenuButton from '../edit-template-part-menu-button';
import BackButton from './back-button';
import ResizableEditor from './resizable-editor';

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

export default function BlockEditor( { setIsInserterOpen } ) {
	const { settings, templateType, templateId, page } = useSelect(
		( select ) => {
			const {
				getSettings,
				getEditedPostType,
				getEditedPostId,
				getPage,
			} = select( editSiteStore );

			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getEditedPostType(),
				templateId: getEditedPostId(),
				page: getPage(),
			};
		},
		[ setIsInserterOpen ]
	);
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const { setPage } = useDispatch( editSiteStore );
	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [ contentRef, useTypingObserver() ] );
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const isTemplatePart = templateType === 'wp_template_part';

	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<EditTemplatePartMenuButton />
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
						renderAppender={ isTemplatePart ? false : undefined }
					/>
				</ResizableEditor>
				<__unstableBlockSettingsMenuFirstItem>
					{ ( { onClose } ) => (
						<BlockInspectorButton onClick={ onClose } />
					) }
				</__unstableBlockSettingsMenuFirstItem>
			</BlockTools>
			<ReusableBlocksMenuItems />
		</BlockEditorProvider>
	);
}
