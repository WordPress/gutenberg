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
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useEffect, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { registerFormatType } from '@wordpress/rich-text';
import { store as editorStore } from '../../store';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import VisualEditor from '../visual-editor';
import { diffRevisionContent } from './block-diff';
import DiffMarkers from './diff-markers';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

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
	.is-revision-removed {
		text-decoration: line-through;
		filter: url(#revision-removed-filter);
	}
	.is-revision-modified {
		outline: 2px solid color-mix(in srgb, currentColor 30%, #dba617 70%) !important;
		outline-offset: 2px;
	}
	.revision-diff-removed {
		text-decoration: line-through;
		background-color: color-mix(in srgb, currentColor 5%, #d63638 25%);
		color: color-mix(in srgb, currentColor 40%, #8b0000 60%);
	}
	.revision-diff-added {
		background-color: color-mix(in srgb, currentColor 5%, #00a32a 15%);
		color: color-mix(in srgb, currentColor 50%, #006400 50%);
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
	.revision-diff-markers {
		position: fixed;
		right: 0;
		top: 0;
		bottom: 0;
		width: 12px;
		background: rgba(0, 0, 0, 0.05);
		z-index: 1000;
	}
	.revision-diff-marker {
		position: absolute;
		width: 100%;
		min-height: 4px;
		border: none;
		padding: 0;
		cursor: pointer;
	}
	.revision-diff-marker.is-added {
		background: #00a32a;
	}
	.revision-diff-marker.is-removed {
		background: #d63638;
	}
	.revision-diff-marker.is-modified {
		background: #dba617;
	}
	.revision-diff-marker:hover {
		opacity: 0.7;
	}
`;

// Register custom format types for revision diff at module level.
registerFormatType( 'revision/diff-removed', {
	name: 'revision/diff-removed',
	title: 'Removed',
	tagName: 'del',
	className: 'revision-diff-removed',
	attributes: { title: 'title' },
	edit: () => null,
} );

registerFormatType( 'revision/diff-added', {
	name: 'revision/diff-added',
	title: 'Added',
	tagName: 'ins',
	className: 'revision-diff-added',
	attributes: { title: 'title' },
	edit: () => null,
} );

registerFormatType( 'revision/diff-format-added', {
	name: 'revision/diff-format-added',
	title: 'Format Added',
	tagName: 'span',
	className: 'revision-diff-format-added',
	attributes: { title: 'title' },
	edit: () => null,
} );

registerFormatType( 'revision/diff-format-removed', {
	name: 'revision/diff-format-removed',
	title: 'Format Removed',
	tagName: 'span',
	className: 'revision-diff-format-removed',
	attributes: { title: 'title' },
	edit: () => null,
} );

registerFormatType( 'revision/diff-format-changed', {
	name: 'revision/diff-format-changed',
	title: 'Format Changed',
	tagName: 'span',
	className: 'revision-diff-format-changed',
	attributes: { title: 'title' },
	edit: () => null,
} );

/**
 * Filter to add diff status CSS classes to blocks.
 *
 * @param {Object} BlockListBlock The original block list block component.
 * @return {Function} Enhanced component with diff status classes.
 */
function withRevisionDiffClasses( BlockListBlock ) {
	return ( props ) => {
		const { attributes, className } = props;
		const diffStatus = attributes?.__revisionDiffStatus;

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
 * Canvas component that renders a post revision in read-only mode.
 *
 * @param {Object} props                  Component props.
 * @param {Object} props.revision         The revision object to display.
 * @param {Object} props.previousRevision The previous revision for diffing.
 * @return {JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas( { revision, previousRevision } ) {
	const { updateEditorSettings } = useDispatch( editorStore );

	// Get current editor settings.
	const { editorSettings, blockEditorSettings } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { getSettings } = select( blockEditorStore );
		return {
			editorSettings: getEditorSettings(),
			blockEditorSettings: getSettings(),
		};
	}, [] );

	// Store original styles on first render.
	const originalStylesRef = useRef( null );
	if ( originalStylesRef.current === null ) {
		originalStylesRef.current = editorSettings.styles || [];
	}

	// Add diff styles and SVG filter to editor settings on mount, restore on unmount.
	useEffect( () => {
		const originalStyles = originalStylesRef.current;
		updateEditorSettings( {
			styles: [
				...originalStyles,
				{ css: REVISION_DIFF_STYLES },
				{ assets: REVISION_REMOVED_FILTER_SVG, __unstableType: 'svgs' },
			],
		} );
		return () => {
			updateEditorSettings( { styles: originalStyles } );
		};
	}, [ updateEditorSettings ] );

	// Diff revision content and parse into blocks with diff status.
	const blocks = useMemo( () => {
		const currentContent = revision?.content?.raw || '';
		const previousContent = previousRevision?.content?.raw || '';

		// diffRevisionContent handles both normal diffing and the case
		// where there's no previous revision (oldest revision shows all as added).
		return diffRevisionContent( currentContent, previousContent );
	}, [ revision?.content?.raw, previousRevision?.content?.raw ] );

	// Modify settings to enable preview mode.
	const settings = useMemo(
		() => ( {
			...blockEditorSettings,
			isPreviewMode: true,
		} ),
		[ blockEditorSettings ]
	);

	if ( ! revision ) {
		return (
			<div className="editor-revisions-canvas__loading">
				<Spinner />
			</div>
		);
	}

	return (
		<ExperimentalBlockEditorProvider value={ blocks } settings={ settings }>
			<VisualEditor canvasOverlay={ <DiffMarkers /> } />
		</ExperimentalBlockEditorProvider>
	);
}
