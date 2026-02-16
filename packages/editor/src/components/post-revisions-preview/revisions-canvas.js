/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import VisualEditor from '../visual-editor';
import {
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
} from './diff-format-types';
import { useDiffMarkers } from './diff-markers';
import { preserveClientIds } from './preserve-client-ids';
import { diffRevisionContent } from './block-diff';

const { ExperimentalBlockEditorProvider, usePrivateStyleOverride } = unlock(
	blockEditorPrivateApis
);

// SVG filter for removed blocks: grayscale + red tint
const REVISION_REMOVED_FILTER_SVG = `
<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 0 0"
	width="0"
	height="0"
	focusable="false"
	role="none"
	aria-hidden="true"
	style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
>
	<defs>
		<filter id="revision-removed-filter" x="0" y="0" width="100%" height="100%">
			<!-- Desaturate and add red tint -->
			<feColorMatrix type="matrix"
				values="0.5 0.3 0.2 0 0.15
				        0.2 0.2 0.1 0 0
				        0.2 0.2 0.1 0 0
				        0   0   0   0.8 0"/>
		</filter>
	</defs>
</svg>
`;

/**
 * CSS for revision diff indicators, injected into the iframe.
 * Uses color-mix() to blend diff colors with currentColor for better integration.
 */
const REVISION_DIFF_STYLES = `
	.is-revision-added {
		box-shadow: inset 0 0 0 9999px color-mix(in srgb, currentColor 5%, #00a32a 15%), 0 0 0 4px color-mix(in srgb, currentColor 5%, #00a32a 15%);
	}
	.is-revision-removed,
	.revision-diff-removed {
		text-decoration: line-through;
		filter: url(#revision-removed-filter);
	}
	.is-revision-modified {
		outline: 2px solid color-mix(in srgb, currentColor 30%, #dba617 70%) !important;
		outline-offset: 2px;
	}
	.revision-diff-added {
		background-color: color-mix(in srgb, currentColor 5%, #00a32a 15%);
		text-decoration: none;
	}
	.revision-diff-format-added {
		text-decoration: underline wavy color-mix(in srgb, currentColor 30%, #00a32a 70%);
		text-decoration-thickness: 2px;
	}
	.revision-diff-format-removed {
		text-decoration: underline wavy color-mix(in srgb, currentColor 20%, #d63638 80%);
		text-decoration-thickness: 2px;
	}
	.revision-diff-format-changed {
		text-decoration: underline wavy color-mix(in srgb, currentColor 30%, #dba617 70%);
		text-decoration-thickness: 2px;
	}
`;

/**
 * Filter to add diff status CSS classes to blocks.
 *
 * @param {Object} BlockListBlock The original block list block component.
 * @return {Function} Enhanced component with diff status classes.
 */
function withRevisionDiffClasses( BlockListBlock ) {
	return ( props ) => {
		const { block, className } = props;
		const diffStatus = block?.__revisionDiffStatus;

		const enhancedClassName = clsx( className, {
			'is-revision-added': diffStatus === 'added',
			'is-revision-removed': diffStatus === 'removed',
			'is-revision-modified': diffStatus === 'modified',
		} );

		return <BlockListBlock { ...props } className={ enhancedClassName } />;
	};
}

const FILTER_NAME = 'editor/revisions-canvas/withRevisionDiffClasses';

// Register the filter at module level to ensure it's available before first render.
addFilter( 'editor.BlockListBlock', FILTER_NAME, withRevisionDiffClasses );

/**
 * Component to inject diff styles via style overrides.
 * Must be rendered inside ExperimentalBlockEditorProvider.
 *
 * @param {Object}  props          Component props.
 * @param {boolean} props.showDiff Whether to show diff highlighting.
 */
function DiffStyleOverrides( { showDiff } ) {
	usePrivateStyleOverride( {
		css: showDiff ? REVISION_DIFF_STYLES : '',
	} );
	usePrivateStyleOverride( {
		assets: showDiff ? REVISION_REMOVED_FILTER_SVG : '',
		__unstableType: 'svgs',
	} );
	return null;
}

function CanvasContent( { showDiff } ) {
	const [ contentRef, diffMarkers ] = useDiffMarkers();
	return (
		<>
			<VisualEditor contentRef={ contentRef } />
			{ showDiff && diffMarkers }
		</>
	);
}

/**
 * Canvas component that renders a post revision in read-only mode.
 *
 * @param {Object}  props          Component props.
 * @param {boolean} props.showDiff Whether to show diff highlighting.
 * @return {React.JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas( { showDiff } ) {
	useEffect( () => {
		registerDiffFormatTypes();
		return () => {
			unregisterDiffFormatTypes();
		};
	}, [] );

	const { revision, previousRevision, postType, blockEditorSettings } =
		useSelect( ( select ) => {
			const {
				getCurrentRevision,
				getPreviousRevision,
				getCurrentPostType,
			} = unlock( select( editorStore ) );
			return {
				revision: getCurrentRevision(),
				previousRevision: getPreviousRevision(),
				postType: getCurrentPostType(),
				blockEditorSettings: select( blockEditorStore ).getSettings(),
			};
		}, [] );

	// Track previously rendered blocks to preserve clientIds between renders.
	const previousBlocksRef = useRef( [] );

	const blocks = useMemo( () => {
		const currentContent = revision?.content?.raw ?? '';

		let parsedBlocks;
		if ( showDiff ) {
			const previousContent = previousRevision?.content?.raw || '';
			// diffRevisionContent handles both normal diffing and the case
			// where there's no previous revision (oldest revision shows all as added).
			parsedBlocks = diffRevisionContent(
				currentContent,
				previousContent
			);
		} else {
			// When diff is disabled, just parse the current revision content.
			parsedBlocks = parse( currentContent );
		}

		if ( postType === 'wp_navigation' ) {
			parsedBlocks = [
				createBlock(
					'core/navigation',
					{ templateLock: false },
					parsedBlocks
				),
			];
		}

		// Preserve clientIds from previous render to prevent React unmount/remount.
		const blocksWithStableIds = preserveClientIds(
			parsedBlocks,
			previousBlocksRef.current
		);

		// Update ref for next render.
		previousBlocksRef.current = blocksWithStableIds;

		return blocksWithStableIds;
	}, [
		revision?.content?.raw,
		previousRevision?.content?.raw,
		postType,
		showDiff,
	] );

	const settings = useMemo(
		() => ( {
			...blockEditorSettings,
			isPreviewMode: true,
		} ),
		[ blockEditorSettings ]
	);

	return revision ? (
		<ExperimentalBlockEditorProvider value={ blocks } settings={ settings }>
			<DiffStyleOverrides showDiff={ showDiff } />
			<div className="editor-revisions-canvas__content">
				<CanvasContent showDiff={ showDiff } />
			</div>
		</ExperimentalBlockEditorProvider>
	) : (
		<div className="editor-revisions-canvas__loading">
			<Spinner />
		</div>
	);
}
