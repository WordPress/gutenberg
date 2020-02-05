/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { uploadMedia } from '@wordpress/media-utils';
import { useEntityProp } from '@wordpress/core-data';
import { parse, serialize } from '@wordpress/blocks';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
	BlockList,
	ButtonBlockerAppender,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';

export default function BlockEditor( { settings: _settings } ) {
	const canUserCreateMedia = useSelect( ( select ) => {
		const _canUserCreateMedia = select( 'core' ).canUser(
			'create',
			'media'
		);
		return _canUserCreateMedia || _canUserCreateMedia !== false;
	}, [] );
	const settings = useMemo( () => {
		if ( ! canUserCreateMedia ) {
			return _settings;
		}
		return {
			..._settings,
			mediaUpload( { onError, ...rest } ) {
				uploadMedia( {
					wpAllowedMimeTypes: _settings.allowedMimeTypes,
					onError: ( { message } ) => onError( message ),
					...rest,
				} );
			},
		};
	}, [ canUserCreateMedia, _settings ] );
	const [ content, _setContent ] = useEntityProp(
		'postType',
		'wp_template',
		'content'
	);
	const initialBlocks = useMemo( () => {
		if ( typeof content !== 'function' ) {
			const parsedContent = parse( content );
			return parsedContent.length ? parsedContent : undefined;
		}
	}, [] );
	const [ blocks = initialBlocks, setBlocks ] = useEntityProp(
		'postType',
		'wp_template',
		'blocks'
	);
	const setContent = useCallback( ( nextBlocks ) => {
		setBlocks( nextBlocks );
		_setContent( serialize( nextBlocks ) );
	}, [] );
	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ setBlocks }
			onChange={ setContent }
		>
			<BlockEditorKeyboardShortcuts />
			<Sidebar.InspectorFill>
				<BlockInspector />
			</Sidebar.InspectorFill>
			<div className="editor-styles-wrapper">
				<WritingFlow>
					<ObserveTyping>
						<BlockList
							className="edit-site-block-editor__block-list"
							renderAppender={ ButtonBlockerAppender }
						/>
					</ObserveTyping>
				</WritingFlow>
			</div>
		</BlockEditorProvider>
	);
}
