import clsx from 'clsx';
import {
	Disabled,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	BlockList,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
	__unstableEditorStyles as EditorStyles,
	__unstableIframe as Iframe,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo, useState, forwardRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useGlobalStylesRevisions } from '@wordpress/global-styles-ui';
import { mergeGlobalStyles } from '@wordpress/global-styles-engine';
import { useGlobalStyles } from '../global-styles/hooks';
import { useGlobalStylesOutputWithConfig } from '../../hooks/use-global-styles-output';
import { unlock } from '../../lock-unlock';
import StylesRevisionsCodeDiff from './revisions-code-diff';
import RevisionDetails from './revision-details';
import useSyncedScroll from './use-synced-scroll';

const {
	ExperimentalBlockEditorProvider,
	BlockStyleVariationOverridesWithConfig,
} = unlock( blockEditorPrivateApis );

function isObjectEmpty( object ) {
	return ! object || Object.keys( object ).length === 0;
}

/**
 * Previews the editor's blocks with a global styles config.
 *
 * @param {Object}                       props            Component props.
 * @param {Object}                       props.config     The global styles config to preview.
 * @param {Object}                       props.baseConfig The theme's base global styles.
 * @param {Array<Object>}                props.blocks     The blocks to preview.
 * @param {Object}                       props.settings   Block editor settings.
 * @param {string}                       props.name       The iframe name.
 * @param {string}                       [props.title]    The iframe's accessible name.
 * @param {React.Ref<HTMLIFrameElement>} [props.frameRef] Receives the iframe element.
 * @return {React.JSX.Element} The preview.
 */
function RevisionPreview( {
	config,
	baseConfig,
	blocks,
	settings,
	name,
	title,
	frameRef,
} ) {
	const mergedConfig = useMemo( () => {
		if ( ! isObjectEmpty( config ) && ! isObjectEmpty( baseConfig ) ) {
			return mergeGlobalStyles( baseConfig, config );
		}
		return {};
	}, [ baseConfig, config ] );

	const [ globalStyles ] = useGlobalStylesOutputWithConfig( mergedConfig );

	const editorStyles =
		! isObjectEmpty( globalStyles ) && ! isObjectEmpty( config )
			? globalStyles
			: settings.styles;

	return (
		<Iframe
			ref={ frameRef }
			className="editor-revisions__iframe"
			name={ name }
			title={ title }
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
					value={ blocks }
					settings={ settings }
				>
					<BlockList renderAppender={ false } />
					{ /*
					 * Styles are printed inside the block editor provider,
					 * so they can access any registered style overrides.
					 */ }
					<EditorStyles styles={ editorStyles } />
					<BlockStyleVariationOverridesWithConfig
						config={ mergedConfig }
					/>
				</ExperimentalBlockEditorProvider>
			</Disabled>
		</Iframe>
	);
}

/**
 * Revisions content component for global styles.
 * Coordinates with ScreenRevisions through the path parameter to display
 * the currently selected revision. When that isn't the current version, the
 * visual view shows the two side by side, and the code view shows what
 * changed between them.
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

	const [ view, setView ] = useState( 'visual' );

	// The selected revision's preview is only there when comparing in the
	// visual view, so the previews scroll together only then.
	const [ selectedFrame, setSelectedFrame ] = useState( null );
	const [ currentFrame, setCurrentFrame ] = useState( null );
	useSyncedScroll( selectedFrame, currentFrame );

	if ( isLoading ) {
		return null;
	}

	// The first entry is the styles the editor shows: the unsaved changes
	// when there are any, else the latest revision.
	const currentRevision = revisions[ 0 ];
	// Comparing the current version with itself would show the same styles
	// twice, so only another revision is shown next to it.
	const isComparingRevision =
		!! selectedRevision && selectedRevision.id !== currentRevision?.id;

	// The code view compares the selected revision with the current styles.
	// The current version itself is compared as the editor holds it, as the
	// sidebar does: the two endpoints need not serialize the same styles
	// identically. A revision the path names but the list doesn't hold has
	// nothing to compare.
	let codeRevision = userConfig;
	if ( isComparingRevision ) {
		codeRevision = selectedRevision;
	} else if ( revisionId && ! selectedRevision ) {
		codeRevision = null;
	}

	const previewProps = {
		baseConfig,
		blocks: renderedBlocksArray,
		settings,
	};

	// Each header is placed over its pane by grid area, so that the panes can
	// stack with their headers when the canvas is narrow.
	return (
		<div
			ref={ ref }
			className={ clsx( 'editor-styles-canvas-revisions', {
				'is-comparing': isComparingRevision,
				'is-visual': view === 'visual',
			} ) }
		>
			{ /* The container query needs an ancestor container, so the grid is a child of it. */ }
			<div className="editor-styles-canvas-revisions__layout">
				{ isComparingRevision && (
					<div className="editor-styles-canvas-revisions__pane-header is-selected">
						<RevisionDetails revision={ selectedRevision } />
					</div>
				) }
				<div className="editor-styles-canvas-revisions__pane-header is-current">
					{ currentRevision && (
						<RevisionDetails
							revision={ currentRevision }
							isCurrent
						/>
					) }
					<div className="editor-styles-canvas-revisions__view-toggle">
						<ToggleGroupControl
							label={ __( 'Revision view' ) }
							hideLabelFromVision
							value={ view }
							onChange={ setView }
						>
							<ToggleGroupControlOption
								value="visual"
								label={ _x( 'Visual', 'style revisions view' ) }
							/>
							<ToggleGroupControlOption
								value="code"
								label={ _x( 'Code', 'style revisions view' ) }
							/>
						</ToggleGroupControl>
					</div>
				</div>
				{ view === 'code' && (
					<div className="editor-styles-canvas-revisions__code">
						<StylesRevisionsCodeDiff
							revision={ codeRevision }
							currentConfig={ userConfig }
						/>
					</div>
				) }
				{ view === 'visual' && isComparingRevision && (
					<div className="editor-styles-canvas-revisions__pane is-selected">
						{ /* The `revisions` name is what tests and tooling look up, so it stays on the pane showing the selected revision. */ }
						<RevisionPreview
							{ ...previewProps }
							config={ selectedRevision }
							frameRef={ setSelectedFrame }
							name="revisions"
							title={ __( 'Selected revision' ) }
						/>
					</div>
				) }
				{ view === 'visual' && (
					<div className="editor-styles-canvas-revisions__pane is-current">
						<RevisionPreview
							{ ...previewProps }
							config={
								isComparingRevision
									? userConfig
									: selectedRevision || userConfig
							}
							frameRef={ setCurrentFrame }
							name={
								isComparingRevision
									? 'revisions-current'
									: 'revisions'
							}
							title={
								isComparingRevision
									? __( 'Current version' )
									: __( 'Revision preview' )
							}
						/>
					</div>
				) }
			</div>
		</div>
	);
}
export default forwardRef( StylesCanvasRevisions );
