/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	__experimentalLinkControl,
	BlockInspector,
	WritingFlow,
	BlockList,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
	__unstableUseTypingObserver as useTypingObserver,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	__unstableUseEditorStyles as useEditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { DropZoneProvider, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';
import { store as editSiteStore } from '../../store';

function Canvas( { body } ) {
	useBlockSelectionClearer( body );
	useTypingObserver( body );

	return (
		<DropZoneProvider>
			<WritingFlow>
				<BlockList className="edit-site-block-editor__block-list" />
			</WritingFlow>
		</DropZoneProvider>
	);
}

export default function BlockEditor( { setIsInserterOpen } ) {
	const { settings, templateType, page, deviceType } = useSelect(
		( select ) => {
			const {
				getSettings,
				getEditedPostType,
				getPage,
				__experimentalGetPreviewDeviceType,
			} = select( editSiteStore );
			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getEditedPostType(),
				page: getPage(),
				deviceType: __experimentalGetPreviewDeviceType(),
			};
		},
		[ setIsInserterOpen ]
	);
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const { setPage } = useDispatch( editSiteStore );

	const resizedCanvasStyles = useResizeCanvas( deviceType, true );
	const ref = useRef();
	const contentRef = useRef();

	useMouseMoveTypingReset( ref );
	// Ideally this should be moved to the place where the styles are applied (iframe)
	const editorStylesRef = useEditorStyles( settings.styles );

	// Allow scrolling "through" popovers over the canvas. This is only called
	// for as long as the pointer is over a popover.
	function onWheel( { deltaX, deltaY } ) {
		contentRef.current.scrollBy( deltaX, deltaY );
	}

	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<BlockEditorKeyboardShortcuts />
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
			<div
				ref={ editorStylesRef }
				className="edit-site-visual-editor"
				onWheel={ onWheel }
			>
				<Popover.Slot name="block-toolbar" />
				<Iframe
					style={ resizedCanvasStyles }
					head={ window.__editorStyles.html }
					ref={ ref }
					contentRef={ contentRef }
				>
					<Canvas body={ contentRef } styles={ settings.styles } />
				</Iframe>
			</div>
		</BlockEditorProvider>
	);
}
