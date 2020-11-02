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
	ObserveTyping,
	BlockList,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import NavigateToLink from '../navigate-to-link';
import { SidebarInspectorFill } from '../sidebar';

export default function BlockEditor( { setIsInserterOpen } ) {
	const { settings, templateType, page } = useSelect(
		( select ) => {
			const { getSettings, getTemplateType, getPage } = select(
				'core/edit-site'
			);
			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getTemplateType(),
				page: getPage(),
			};
		},
		[ setIsInserterOpen ]
	);
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);

	const { setPage } = useDispatch( 'core/edit-site' );
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
			<div className="editor-styles-wrapper edit-site-block-editor__editor-styles-wrapper">
				<WritingFlow>
					<ObserveTyping>
						<BlockList className="edit-site-block-editor__block-list" />
					</ObserveTyping>
				</WritingFlow>
			</div>
		</BlockEditorProvider>
	);
}
