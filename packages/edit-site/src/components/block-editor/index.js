/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import {
	__experimentalLinkControl,
	BlockInspector,
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

const LAYOUT = {
	type: 'default',
	// At the root level of the site editor, no alignments should be allowed.
	alignments: [],
};

export default function BlockEditor( { setIsInserterOpen } ) {
	const { styles, page, deviceType } = useSelect(
		( select ) => {
			const {
				getSettings,
				getPage,
				__experimentalGetPreviewDeviceType,
			} = select( editSiteStore );
			return {
				styles: getSettings().styles,
				page: getPage(),
				deviceType: __experimentalGetPreviewDeviceType(),
			};
		},
		[ setIsInserterOpen ]
	);
	const { setPage } = useDispatch( editSiteStore );
	const resizedCanvasStyles = useResizeCanvas( deviceType, true );
	const ref = useMouseMoveTypingReset();
	const contentRef = useRef();
	const mergedRefs = useMergeRefs( [ contentRef, useTypingObserver() ] );

	return (
		<>
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
				className="edit-site-visual-editor"
				__unstableContentRef={ contentRef }
			>
				<Iframe
					style={ resizedCanvasStyles }
					head={ <EditorStyles styles={ styles } /> }
					ref={ ref }
					contentRef={ mergedRefs }
					name="editor-canvas"
				>
					<BlockList
						className="edit-site-block-editor__block-list wp-site-blocks"
						__experimentalLayout={ LAYOUT }
					/>
				</Iframe>
				<__unstableBlockSettingsMenuFirstItem>
					{ ( { onClose } ) => (
						<BlockInspectorButton onClick={ onClose } />
					) }
				</__unstableBlockSettingsMenuFirstItem>
			</BlockTools>
		</>
	);
}
