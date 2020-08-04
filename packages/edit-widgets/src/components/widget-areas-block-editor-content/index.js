/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { uploadMedia } from '@wordpress/media-utils';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	WritingFlow,
	ObserveTyping,
	BlockList,
} from '@wordpress/block-editor';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';
import { KIND, WIDGET_AREA_ENTITY_TYPE } from '../../store/utils';

const EMPTY_ARRAY = [];
export default function WidgetAreasBlockEditorContent( {
	blockEditorSettings,
} ) {
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );
	const widgetAreas = useSelect( ( select ) => {
		const { getWidgetAreas } = select( 'core/edit-widgets' );
		return getWidgetAreas() || EMPTY_ARRAY;
	} );

	return (
		<>
			<KeyboardShortcuts />
			<BlockEditorKeyboardShortcuts />
			<Notices />
			<Popover.Slot name="block-toolbar" />
			<div tabIndex="-1" onFocus={ clearSelectedBlock }>
				<div
					className="editor-styles-wrapper"
					onFocus={ ( event ) => {
						// Stop propagation of the focus event to avoid the parent
						// widget layout component catching the event and removing the selected area.
						event.stopPropagation();
						event.preventDefault();
					} }
				>
					<WritingFlow>
						<ObserveTyping>
							{ widgetAreas.map( ( widgetArea ) => {
								return (
									<WidgetAreaEditor
										key={ widgetArea.id }
										blockEditorSettings={
											blockEditorSettings
										}
										widgetArea={ widgetArea }
									/>
								);
							} ) }
						</ObserveTyping>
					</WritingFlow>
				</div>
			</div>
		</>
	);
}

function WidgetAreaEditor( { widgetArea, blockEditorSettings } ) {
	const { hasUploadPermissions } = useSelect( ( select ) => {
		return {
			hasUploadPermissions: defaultTo(
				select( 'core' ).canUser( 'create', 'media' ),
				true
			),
		};
	} );

	const settings = useMemo( () => {
		let mediaUploadBlockEditor;
		if ( hasUploadPermissions ) {
			mediaUploadBlockEditor = ( { onError, ...argumentsObject } ) => {
				uploadMedia( {
					wpAllowedMimeTypes: blockEditorSettings.allowedMimeTypes,
					onError: ( { message } ) => onError( message ),
					...argumentsObject,
				} );
			};
		}
		return {
			...blockEditorSettings,
			mediaUpload: mediaUploadBlockEditor,
			templateLock: 'all',
		};
	}, [ blockEditorSettings, hasUploadPermissions ] );

	const [ blocks, onInput, _onChange ] = useEntityBlockEditor(
		KIND,
		WIDGET_AREA_ENTITY_TYPE,
		{ id: widgetArea.id }
	);

	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ _onChange }
			settings={ settings }
		>
			<BlockList className="edit-widgets-main-block-list" />
		</BlockEditorProvider>
	);
}
