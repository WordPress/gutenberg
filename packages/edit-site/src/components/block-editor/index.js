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
	BlockTools,
	__unstableBlockSettingsMenuFirstItem,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableUseTypingObserver as useTypingObserver,
	__unstableUseMouseMoveTypingReset as useMouseMoveTypingReset,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';
import { store as editSiteStore } from '../../store';
import BlockInspectorButton from './block-inspector-button';

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
	const ref = useMouseMoveTypingReset();
	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [ contentRef, useTypingObserver() ] );

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
			<div className="edit-site-visual-editor">
				<BlockTools __unstableContentRef={ contentRef }>
					<Iframe
						style={ resizedCanvasStyles }
						head={ <EditorStyles styles={ settings.styles } /> }
						ref={ ref }
						contentRef={ mergedRefs }
					>
						<WritingFlow>
							<BlockList
								className="edit-site-block-editor__block-list"
								__experimentalLayout={ {
									type: 'default',
									// At the root level of the site editor, no alignments should be allowed.
									alignments: [],
								} }
							/>
						</WritingFlow>
					</Iframe>
				</BlockTools>
				<__unstableBlockSettingsMenuFirstItem>
					{ ( { onClose } ) => (
						<BlockInspectorButton onClick={ onClose } />
					) }
				</__unstableBlockSettingsMenuFirstItem>
			</div>
		</BlockEditorProvider>
	);
}
