import clsx from 'clsx';
import { Spinner } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useContext, useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { store as blocksStore } from '@wordpress/blocks';
import { sprintf, __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import VisualEditor from '../visual-editor';
import {
	registerDiffFormatTypes,
	unregisterDiffFormatTypes,
	DIFF_DESCRIPTION_IDS,
} from './diff-format-types';
import { useDiffMarkers } from './diff-markers';

const { usePrivateStyleOverride, PrivateBlockContext } = unlock(
	blockEditorPrivateApis
);

// SVG filter for Removed blocks: grayscale + red tint
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
		outline: 3px solid #00a32a;
		outline-offset: 2px;
	}
	.is-revision-removed,
	.revision-diff-removed {
		text-decoration: line-through;
		filter: url(#revision-removed-filter);
	}
	.is-revision-removed {
		outline: 3px dashed #d63638;
		outline-offset: 2px;
	}
	.is-revision-modified {
		outline: 3px dotted #9a7000 !important;
		outline-offset: 2px;
	}
	.revision-diff-added {
		background-color: color-mix(in srgb, currentColor 5%, #00a32a 15%);
		text-decoration: none;
	}
	/* Reset UA <mark> styles so format markers keep the same look as before. */
	mark.revision-diff-format-added,
	mark.revision-diff-format-removed,
	mark.revision-diff-format-changed {
		background: transparent;
		color: inherit;
		padding: 0;
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
 * Returns an accessible label for a block based on its revision diff status.
 *
 * @param {string} status     The diff status: 'added', 'removed', or 'modified'.
 * @param {string} blockTitle The human-readable block type name.
 * @return {string|undefined} The aria-label string, or undefined if not applicable.
 */
function getDiffStatusLabel( status, blockTitle ) {
	switch ( status ) {
		case 'added':
			// translators: %s: block type name e.g. "Paragraph"
			return sprintf( __( 'Added block: %s' ), blockTitle );
		case 'removed':
			// translators: %s: block type name e.g. "Paragraph"
			return sprintf( __( 'Removed block: %s' ), blockTitle );
		case 'modified':
			// translators: %s: block type name e.g. "Paragraph"
			return sprintf( __( 'Modified block: %s' ), blockTitle );
	}
}

/**
 * Overrides the wrapped block's aria-label with its diff status label.
 *
 * Only the block itself is affected: nested blocks set up their own private
 * context, so they don't inherit an ancestor's diff label.
 *
 * @param {Object}      props            Component props.
 * @param {string}      props.status     The diff status.
 * @param {string}      props.name       The block name.
 * @param {Object}      props.attributes The block attributes.
 * @param {JSX.Element} props.children   The block to label.
 * @return {JSX.Element} The labelled block.
 */
function BlockDiffLabelProvider( { status, name, attributes, children } ) {
	const context = useContext( PrivateBlockContext );
	// Resolve the variation-aware title (e.g. "Row" instead of "Group") so
	// blocks are announced by the name users know them as. The canvas's
	// default wrapper labels can't be reused here: in preview mode they
	// intentionally skip variation matching.
	const blockTitle = useSelect(
		( select ) => {
			const { getActiveBlockVariation, getBlockType } =
				select( blocksStore );
			return (
				getActiveBlockVariation( name, attributes )?.title ??
				getBlockType( name )?.title
			);
		},
		[ name, attributes ]
	);
	return (
		<PrivateBlockContext.Provider
			value={ {
				...context,
				ariaLabel: blockTitle
					? getDiffStatusLabel( status, blockTitle )
					: undefined,
			} }
		>
			{ children }
		</PrivateBlockContext.Provider>
	);
}

/**
 * Filter to add diff status CSS classes to blocks.
 *
 * @param {Object} BlockListBlock The original block list block component.
 * @return {Function} Enhanced component with diff status classes.
 */
function withRevisionDiffClasses( BlockListBlock ) {
	return function WithRevisionDiffClasses( props ) {
		const { block, className, name, attributes } = props;
		const diffStatus = block?.__revisionDiffStatus?.status;

		const enhancedClassName = clsx( className, {
			'is-revision-added': diffStatus === 'added',
			'is-revision-removed': diffStatus === 'removed',
			'is-revision-modified': diffStatus === 'modified',
		} );

		// This filter runs for every block in every editor, so the private
		// context is only overridden where a diff status actually applies.
		if ( ! diffStatus ) {
			return (
				<BlockListBlock { ...props } className={ enhancedClassName } />
			);
		}

		return (
			<BlockDiffLabelProvider
				status={ diffStatus }
				name={ name }
				attributes={ attributes }
			>
				<BlockListBlock { ...props } className={ enhancedClassName } />
			</BlockDiffLabelProvider>
		);
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

/**
 * Visually hidden descriptions that diff marks (<del>, <ins>, <mark>)
 * reference via `aria-describedby`. They must be rendered inside the
 * canvas iframe because `aria-describedby` cannot reference an element
 * across a document/iframe boundary. This is more reliable than `title`,
 * which some screen readers ignore in low-verbosity modes.
 */
function DiffDescriptions() {
	return (
		<VisuallyHidden>
			<span id={ DIFF_DESCRIPTION_IDS.removed }>{ __( 'Removed' ) }</span>
			<span id={ DIFF_DESCRIPTION_IDS.added }>{ __( 'Added' ) }</span>
			<span id={ DIFF_DESCRIPTION_IDS.formatAdded }>
				{ __( 'Format added' ) }
			</span>
			<span id={ DIFF_DESCRIPTION_IDS.formatRemoved }>
				{ __( 'Format removed' ) }
			</span>
			<span id={ DIFF_DESCRIPTION_IDS.formatChanged }>
				{ __( 'Format changed' ) }
			</span>
		</VisuallyHidden>
	);
}

function CanvasContent( { showDiff } ) {
	const [ contentRef, diffMarkers ] = useDiffMarkers();
	return (
		<>
			{ showDiff && <DiffDescriptions /> }
			<VisualEditor contentRef={ contentRef } />
			{ showDiff && diffMarkers }
		</>
	);
}

/**
 * Canvas component that renders a post revision in read-only mode.
 * Block preparation and settings are handled by the parent EditorProvider.
 *
 * @return {React.JSX.Element} The revisions canvas component.
 */
export default function RevisionsCanvas() {
	useEffect( () => {
		registerDiffFormatTypes();
		return () => {
			unregisterDiffFormatTypes();
		};
	}, [] );

	const { revision, showDiff } = useSelect( ( select ) => {
		const { getCurrentRevision, isShowingRevisionDiff } = unlock(
			select( editorStore )
		);
		return {
			revision: getCurrentRevision(),
			showDiff: isShowingRevisionDiff(),
		};
	}, [] );

	return revision ? (
		<>
			<DiffStyleOverrides showDiff={ showDiff } />
			<div className="editor-revisions-canvas__content">
				<CanvasContent showDiff={ showDiff } />
			</div>
		</>
	) : (
		<div className="editor-revisions-canvas__loading">
			<Spinner />
		</div>
	);
}
