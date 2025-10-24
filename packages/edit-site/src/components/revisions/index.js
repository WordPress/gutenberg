/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo, forwardRef } from '@wordpress/element';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */

import { unlock } from '../../lock-unlock';
import { useGlobalStylesOutputWithConfig } from '../../hooks/use-global-styles-output';
import { useGlobalStyles } from '../global-styles';

const {
	ExperimentalBlockEditorProvider,
	__unstableBlockStyleVariationOverridesWithConfig,
} = unlock( blockEditorPrivateApis );

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

function Revisions( { userConfig, blocks }, ref ) {
	const { base: baseConfig } = useGlobalStyles();

	const mergedConfig = useMemo( () => {
		if ( ! isObjectEmpty( userConfig ) && ! isObjectEmpty( baseConfig ) ) {
			return mergeGlobalStyles( baseConfig, userConfig );
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
		() => ( {
			...originalSettings,
			isPreviewMode: true,
		} ),
		[ originalSettings ]
	);

	const [ globalStyles ] = useGlobalStylesOutputWithConfig( mergedConfig );

	const editorStyles =
		! isObjectEmpty( globalStyles ) && ! isObjectEmpty( userConfig )
			? globalStyles
			: settings.styles;

	return (
		<Iframe
			ref={ ref }
			className="edit-site-revisions__iframe"
			name="revisions"
			tabIndex={ 0 }
		>
			<style>
				{
					// Forming a "block formatting context" to prevent margin collapsing.
					// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
					`.is-root-container { display: flow-root; }`
				}
			</style>
			<Disabled className="edit-site-revisions__example-preview__content">
				<ExperimentalBlockEditorProvider
					value={ renderedBlocksArray }
					settings={ settings }
				>
					<BlockList renderAppender={ false } />
					{ /*
					 * Styles are printed inside the block editor provider,
					 * so they can access any registered style overrides.
					 */ }
					<EditorStyles styles={ editorStyles } />
					<__unstableBlockStyleVariationOverridesWithConfig
						config={ mergedConfig }
					/>
				</ExperimentalBlockEditorProvider>
			</Disabled>
		</Iframe>
	);
}

export default forwardRef( Revisions );
