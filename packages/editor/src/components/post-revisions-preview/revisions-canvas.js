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
import { store as editorStore } from '../../store';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import VisualEditor from '../visual-editor';
import { diffRevisionContent } from './block-diff';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

/**
 * CSS for revision diff indicators, injected into the iframe.
 */
const REVISION_DIFF_STYLES = `
	.is-revision-added {
		outline: 2px solid #00a32a !important;
		outline-offset: 2px;
	}
	.is-revision-removed {
		outline: 2px solid #d63638 !important;
		outline-offset: 2px;
		opacity: 0.5;
	}
	.is-revision-modified {
		outline: 2px solid #dba617 !important;
		outline-offset: 2px;
	}
	.revision-diff-removed {
		text-decoration: line-through;
		background-color: rgba(214, 54, 56, 0.2);
		color: #8b0000;
	}
	.revision-diff-added {
		background-color: rgba(0, 163, 42, 0.2);
		color: #006400;
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

	// Add diff styles to editor settings on mount, restore on unmount.
	useEffect( () => {
		const originalStyles = originalStylesRef.current;
		updateEditorSettings( {
			styles: [ ...originalStyles, { css: REVISION_DIFF_STYLES } ],
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
			<VisualEditor />
		</ExperimentalBlockEditorProvider>
	);
}
