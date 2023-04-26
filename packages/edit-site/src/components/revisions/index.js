/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

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
import {
	useFocusOnMount,
	useFocusReturn,
} from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */

import { unlock } from '../../private-apis';
import { mergeBaseAndUserConfigs } from '../global-styles/global-styles-provider';
import EditorCanvasContainer from '../editor-canvas';

const {
	ExperimentalBlockEditorProvider,
	useGlobalStyle,
	useGlobalStylesOutput,
} = unlock( blockEditorPrivateApis );

function Revisions( { onClose, userConfig, blocks } ) {
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const sectionFocusReturnRef = useFocusReturn();
	const [ textColor ] = useGlobalStyle( 'color.text' );
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );

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
		if ( ! isEmpty( userConfig ) && ! isEmpty( baseConfig ) ) {
			return mergeBaseAndUserConfigs( baseConfig, userConfig );
		}
		return null;
	}, [ baseConfig, userConfig ] );


	// BLOCKS
	/*
		const renderedBlocks = useSelect(
			( select ) => select( blockEditorStore ).getBlocks(),
			[]
		);

		const renderedBlocksArray = useMemo(
			() =>
				Array.isArray( renderedBlocks )
					? renderedBlocks
					: [ renderedBlocks ],
			[ renderedBlocks ]
		);

	*/

	const originalSettings = useSelect(
		( select ) => select( blockEditorStore ).getSettings(),
		[]
	);
	const settings = useMemo(
		() => ( { ...originalSettings, __unstableIsPreviewMode: true } ),
		[ originalSettings ]
	);

	const [ globalStyles ] = useGlobalStylesOutput( mergedConfig );
	const editorStyles =
		! isEmpty( globalStyles ) && ! isEmpty( globalStylesRevision )
			? globalStyles
			: settings.styles;

	return (
		<EditorCanvasContainer title={ __( 'Revisions' ) } onClose={ onClose }>
			<Iframe
				className="edit-site-style-book__iframe"
				name="style-revisions"
				tabIndex={ 0 }
			>
				<EditorStyles styles={ editorStyles } />
				<style>
					{
						// Forming a "block formatting context" to prevent margin collapsing.
						// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
						`.is-root-container { display: flow-root; }
											body { position: relative; padding: 32px; }`
					}
				</style>
				<Disabled className="edit-site-style-book__example-preview__content">
					<ExperimentalBlockEditorProvider
						value={ blocks }
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
