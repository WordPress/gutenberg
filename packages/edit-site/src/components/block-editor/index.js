/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
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
	__unstableUseEditorStyles as useEditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { DropZoneProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';

function Canvas( { body, styles } ) {
	useBlockSelectionClearer( body );
	useTypingObserver( body );
	useEditorStyles( body, styles );

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
				getTemplateType,
				getPage,
				__experimentalGetPreviewDeviceType,
			} = select( 'core/edit-site' );
			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getTemplateType(),
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
	const { setPage } = useDispatch( 'core/edit-site' );

	const resizedCanvasStyles = useResizeCanvas( deviceType, true );

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
			<Iframe
				style={ resizedCanvasStyles }
				head={ window.__editorStyles.html }
			>
				{ ( body ) => (
					<Canvas body={ body } styles={ settings.styles } />
				) }
			</Iframe>
		</BlockEditorProvider>
	);
}
