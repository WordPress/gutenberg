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
import { useEditorContext } from '../editor';
import Sidebar from '../sidebar';

export default function BlockEditor() {
	const { settings: _settings } = useEditorContext();
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
		settings.templateType,
		'content'
	);
	const initialBlocks = useMemo( () => {
		if ( typeof content !== 'function' ) {
			const parsedContent = parse( content );
			return parsedContent.length ? parsedContent : [];
		}
	}, [ settings.templateId ] );
	const [ blocks = initialBlocks, setBlocks ] = useEntityProp(
		'postType',
		settings.templateType,
		'blocks'
	);
	const setContent = useCallback(
		( nextBlocks ) => {
			setBlocks( nextBlocks );
			_setContent( serialize( nextBlocks ) );
		},
		[ setBlocks, _setContent ]
	);
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
