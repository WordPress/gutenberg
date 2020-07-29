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
	const { areas, hasUploadPermissions } = useSelect( ( select ) => {
		const { canUser, getEntityRecords } = select( 'core' );
		return {
			areas: getEntityRecords( 'root', 'widgetArea' ) || EMPTY_ARRAY,
			hasUploadPermissions: defaultTo(
				canUser( 'create', 'media' ),
				true
			),
		};
	} );
	const [ blocks, setBlocks ] = useState( [] );
	useEffect( () => {
		if ( ! areas || ! areas.length || blocks.length > 0 ) {
			return;
		}
		setBlocks(
			areas.map( ( { id, name } ) => {
				return createBlock( 'core/widget-area', {
					id,
					name,
				} );
			} )
		);
	}, [ areas, blocks ] );

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
							onInput={ ( newBlocks ) => setBlocks( newBlocks ) }
							onChange={ ( newBlocks ) => setBlocks( newBlocks ) }
							settings={ settings }
							{ ...props }
						/>
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
