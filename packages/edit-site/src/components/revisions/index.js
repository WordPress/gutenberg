/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */

import { unlock } from '../../lock-unlock';
import { mergeBaseAndUserConfigs } from '../global-styles/global-styles-provider';
import EditorCanvasContainer from '../editor-canvas-container';

const { ExperimentalBlockEditorProvider, useGlobalStylesOutputWithConfig } =
	unlock( blockEditorPrivateApis );

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

function Revisions( { onClose, userConfig, blocks } ) {
	const { baseConfig } = useSelect(
		( select ) => ( {
			baseConfig:
				select(
					coreStore
				).__experimentalGetCurrentThemeBaseGlobalStyles(),
		} ),
		[]
	);

	const mergedConfig = useMemo( () => {
		if ( ! isObjectEmpty( userConfig ) && ! isObjectEmpty( baseConfig ) ) {
			return mergeBaseAndUserConfigs( baseConfig, userConfig );
		}
		return {};
	}, [ baseConfig, userConfig ] );

	const renderedBlocksArray = useMemo(
		() => ( Array.isArray( blocks ) ? blocks : [ blocks ] ),
		[ blocks ]
	);

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	const [ globalStyles ] = useGlobalStylesOutputWithConfig( mergedConfig );

	const editorStyles =
		! isObjectEmpty( globalStyles ) && ! isObjectEmpty( userConfig )
			? globalStyles
			: settings.styles;

	return (
		<EditorCanvasContainer
			title={ __( 'Revisions' ) }
			onClose={ onClose }
			closeButtonLabel={ __( 'Close revisions' ) }
			enableResizing={ true }
		>
			<Iframe
				className="edit-site-revisions__iframe"
				name="revisions"
				tabIndex={ 0 }
			>
				<EditorStyles styles={ editorStyles } />
				<style>
					{
						// Forming a "block formatting context" to prevent margin collapsing.
						// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
						`.is-root-container { display: flow-root; } body { position: relative; padding: 32px; }`
					}
				</style>
				<Disabled className="edit-site-revisions__example-preview__content">
					<ExperimentalBlockEditorProvider
						value={ renderedBlocksArray }
						settings={ settings }
					>
						<BlockList renderAppender={ false } />
					</ExperimentalBlockEditorProvider>
				</Disabled>
			</Iframe>
		</EditorCanvasContainer>
	);
}

export default Revisions;
