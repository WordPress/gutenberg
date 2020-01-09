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
	URLPopover,
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
import NavigateToLink from '../navigate-to-link';
import Sidebar from '../sidebar';

export default function BlockEditor() {
	const { settings: _settings, setSettings } = useEditorContext();
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
	const setActiveTemplateId = useCallback(
		( newTemplateId ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				templateId: newTemplateId,
				templateType: 'wp_template',
			} ) ),
		[]
	);
	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ setBlocks }
			onChange={ setContent }
			useSubRegistry={ false }
		>
			<BlockEditorKeyboardShortcuts />
			<URLPopover.LinkViewer.Fill>
				{ useCallback(
					( fillProps ) => (
						<NavigateToLink
							{ ...fillProps }
							templateIds={ settings.templateIds }
							activeId={ settings.templateId }
							onActiveIdChange={ setActiveTemplateId }
						/>
					),
					[ settings.templateIds, settings.templateId, setActiveTemplateId ]
				) }
			</URLPopover.LinkViewer.Fill>
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
