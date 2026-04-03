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
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useGlobalStyles } from '../global-styles/hooks';
import { useGlobalStylesOutputWithConfig } from '../../hooks/use-global-styles-output';
import { unlock } from '../../lock-unlock';

const {
	ExperimentalBlockEditorProvider,
	__unstableBlockStyleVariationOverridesWithConfig,
} = unlock( blockEditorPrivateApis );

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

/**
 * Revisions content component for global styles.
 * Coordinates with ScreenRevisions through the path parameter to display
 * the currently selected revision.
 *
 * @param {Object}             props      Component props.
 * @param {string}             props.path Current path in global styles.
 * @param {React.ForwardedRef} ref        Ref to the Revisions component.
 * @return {React.JSX.Element} The Revisions component or null if loading.
 */
function StylesCanvasRevisions( { path }, ref ) {
	const blocks = useSelect( ( select ) => {
		// This is not ideal: it's like a loop (reading from block-editor to render it).
		return select( blockEditorStore ).getBlocks();
	}, [] );
	const { user: userConfig, base: baseConfig } = useGlobalStyles();

	// Fetch all revisions (includes unsaved, parent, and enriched with authors)
	const { revisions, isLoading } = useGlobalStylesRevisions();

	// Parse revision ID from path (e.g., "/revisions/123" -> "123")
	const revisionId = useMemo( () => {
		const match = path?.match( /^\/revisions\/(.+)$/ );
		return match ? match[ 1 ] : null;
	}, [ path ] );

	// Find the selected revision from the fetched list
	const selectedRevision = useMemo( () => {
		if ( ! revisionId || ! revisions.length ) {
			return null;
		}
		return revisions.find(
			( rev ) => String( rev.id ) === String( revisionId )
		);
	}, [ revisionId, revisions ] );

	// Use the selected revision's config if available, otherwise use current user config
	const displayConfig = selectedRevision || userConfig;

	// Merge the display config with the base config
	const mergedConfig = useMemo( () => {
		if (
			! isObjectEmpty( displayConfig ) &&
			! isObjectEmpty( baseConfig )
		) {
			return mergeGlobalStyles( baseConfig, displayConfig );
		}
		return {};
	}, [ baseConfig, displayConfig ] );

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
		! isObjectEmpty( globalStyles ) && ! isObjectEmpty( displayConfig )
			? globalStyles
			: settings.styles;

	if ( isLoading ) {
		return null;
	}

	return (
		<Iframe
			ref={ ref }
			className="editor-revisions__iframe"
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
			<Disabled className="editor-revisions__example-preview__content">
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
export default forwardRef( StylesCanvasRevisions );
