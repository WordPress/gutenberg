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
import { useEffect, useMemo, useState } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../keyboard-shortcuts';

const EMPTY_ARRAY = [];

export default function WidgetAreasBlockEditorProvider( {
	blockEditorSettings,
	...props
} ) {
	const { widgetAreas, hasUploadPermissions } = useSelect( ( select ) => {
		const { getWidgetAreas } = select( 'core/edit-widgets' );
		return {
			widgetAreas: getWidgetAreas() || EMPTY_ARRAY,
			hasUploadPermissions: defaultTo(
				select( 'core' ).canUser( 'create', 'media' ),
				true
			),
		};
	} );

	const [ blocks, setBlocks ] = useState( [] );
	useEffect( () => {
		if ( ! widgetAreas || ! widgetAreas.length || blocks.length > 0 ) {
			return;
		}
		setBlocks(
			widgetAreas.map( ( { id, name } ) => {
				return createBlock( 'core/widget-area', {
					id,
					name,
				} );
			} )
		);
	}, [ widgetAreas, blocks ] );

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

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<BlockEditorProvider
							value={ blocks }
							onInput={ ( newBlocks ) => {
								console.log( newBlocks );
								setBlocks( newBlocks );
							} }
							onChange={ ( newBlocks ) => {
								console.log( newBlocks );
								setBlocks( newBlocks );
							} }
							settings={ settings }
							{ ...props }
						/>
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
