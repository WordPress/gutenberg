/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { uploadMedia } from '@wordpress/media-utils';
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
	__experimentalLinkControl,
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
	const { canUserCreateMedia, focusMode, hasFixedToolbar } = useSelect(
		( select ) => {
			const { isFeatureActive } = select( 'core/edit-site' );
			const _canUserCreateMedia = select( 'core' ).canUser(
				'create',
				'media'
			);
			return {
				canUserCreateMedia:
					_canUserCreateMedia || _canUserCreateMedia !== false,
				focusMode: isFeatureActive( 'focusMode' ),
				hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			};
		},
		[]
	);

	const settings = useMemo( () => {
		if ( ! canUserCreateMedia ) {
			return _settings;
		}
		return {
			..._settings,
			focusMode,
			hasFixedToolbar,
			mediaUpload( { onError, ...rest } ) {
				uploadMedia( {
					wpAllowedMimeTypes: _settings.allowedMimeTypes,
					onError: ( { message } ) => onError( message ),
					...rest,
				} );
			},
		};
	}, [ canUserCreateMedia, _settings, focusMode, hasFixedToolbar ] );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		settings.templateType
	);
	const setActivePageAndTemplateId = useCallback(
		( { page, templateId } ) =>
			setSettings( ( prevSettings ) => ( {
				...prevSettings,
				page,
				templateId,
				templateType: 'wp_template',
			} ) ),
		[]
	);

	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			<BlockEditorKeyboardShortcuts />
			<__experimentalLinkControl.ViewerFill>
				{ useCallback(
					( fillProps ) => (
						<NavigateToLink
							{ ...fillProps }
							activePage={ settings.page }
							onActivePageAndTemplateIdChange={
								setActivePageAndTemplateId
							}
						/>
					),
					[ settings.page, setActivePageAndTemplateId ]
				) }
			</__experimentalLinkControl.ViewerFill>
			<Sidebar.InspectorFill>
				<BlockInspector />
			</Sidebar.InspectorFill>
			<div className="editor-styles-wrapper edit-site-block-editor__editor-styles-wrapper">
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
