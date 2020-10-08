/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	SlotFillProvider,
	FocusReturnProvider,
} from '@wordpress/components';
import { uploadMedia } from '@wordpress/media-utils';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../keyboard-shortcuts';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../../store/utils';

export default function WidgetAreasBlockEditorProvider( {
	blockEditorSettings,
	...props
} ) {
	const { hasUploadPermissions } = useSelect( ( select ) => ( {
		hasUploadPermissions: defaultTo(
			select( 'core' ).canUser( 'create', 'media' ),
			true
		),
		widgetAreas: select( 'core/edit-widgets' ).getWidgetAreas(),
	} ) );

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

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		KIND,
		POST_TYPE,
		{ id: buildWidgetAreasPostId() }
	);

	return (
		<>
			<EditorStyles styles={ settings.styles } />
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<BlockEditorProvider
							value={ blocks }
							onInput={ onInput }
							onChange={ onChange }
							settings={ settings }
							useSubRegistry={ false }
							{ ...props }
						/>
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
