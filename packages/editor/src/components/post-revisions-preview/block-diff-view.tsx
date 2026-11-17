import clsx from 'clsx';
import type { ComponentType, Context, ReactNode } from 'react';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { sprintf, __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';
import { DIFF_DESCRIPTION_IDS } from './diff-format-types';

/**
 * The visual layer for rendering blocks produced by `diffRevisionContent`:
 * the diff CSS, the removed-block SVG filter, the accessible descriptions,
 * and the `editor.BlockListBlock` filter that stamps diff status classes
 * and labels onto blocks. Shared by the revisions canvas and by hosts that
 * render diffed blocks outside the revisions screen, such as a
 * collaboration plugin's conflict review.
 */

const {
	PrivateBlockContext,
}: {
	PrivateBlockContext: Context< Record< string, unknown > >;
} = unlock( blockEditorPrivateApis );

// SVG filter for Removed blocks: grayscale + red tint
export const REVISION_REMOVED_FILTER_SVG = `
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
 * CSS for revision diff indicators. The revisions canvas injects it into
 * its iframe. Other hosts render it in a style tag, together with the SVG
 * filter above, since the removed styles reference the filter by id in the
 * same document.
 * Uses color-mix() to blend diff colors with currentColor for better integration.
 */
export const REVISION_DIFF_STYLES = `
	.is-revision-added {
		box-shadow: inset 0 0 0 9999px color-mix(in srgb, currentColor 5%, #00a32a 15%), 0 0 0 4px color-mix(in srgb, currentColor 5%, #00a32a 15%);
		outline: 3px solid #00a32a;
		outline-offset: 2px;
	}
	.is-revision-removed,
	.revision-diff-removed {
		text-decoration: line-through;
	}
	.is-revision-removed {
		outline: 3px dashed #d63638;
		outline-offset: 2px;
		filter: url(#revision-removed-filter);
	}
	.revision-diff-removed {
		/* Mirror .revision-diff-added so the ins/del pair reads symmetrically.
		   Leaving the text at currentColor (rather than recolouring it with an
		   opacity + color-matrix filter) keeps the theme's own AA-compliant body
		   contrast on any background. */
		background-color: color-mix(in srgb, currentColor 5%, #d63638 15%);
		text-decoration-color: #d63638;
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
 * @param status     The diff status: 'added', 'removed', or 'modified'.
 * @param blockTitle The human-readable block type name.
 * @return The aria-label string, or undefined if not applicable.
 */
function getDiffStatusLabel(
	status: string,
	blockTitle: string
): string | undefined {
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

	return undefined;
}

/**
 * Overrides the wrapped block's aria-label with its diff status label.
 *
 * Only the block itself is affected: nested blocks set up their own private
 * context, so they don't inherit an ancestor's diff label.
 *
 * @param props            Component props.
 * @param props.status     The diff status.
 * @param props.name       The block name.
 * @param props.attributes The block attributes.
 * @param props.children   The block to label.
 * @return The labelled block.
 */
function BlockDiffLabelProvider( {
	status,
	name,
	attributes,
	children,
}: {
	status: string;
	name: string;
	attributes: Record< string, unknown >;
	children: ReactNode;
} ) {
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
 * The props of a block list block that the diff classes read.
 */
interface BlockListBlockProps {
	block?: { __revisionDiffStatus?: { status?: string } };
	className?: string;
	name: string;
	attributes: Record< string, unknown >;
}

/**
 * Filter to add diff status CSS classes to blocks.
 *
 * @param BlockListBlock The original block list block component.
 * @return Enhanced component with diff status classes.
 */
function withRevisionDiffClasses(
	BlockListBlock: ComponentType< BlockListBlockProps >
) {
	return function WithRevisionDiffClasses( props: BlockListBlockProps ) {
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
 * Visually hidden descriptions that diff marks (<del>, <ins>, <mark>)
 * reference via `aria-describedby`. They must be rendered in the same
 * document as the marks (inside the canvas iframe for the revisions
 * screen) because `aria-describedby` cannot reference an element across
 * a document/iframe boundary. This is more reliable than `title`,
 * which some screen readers ignore in low-verbosity modes.
 */
export function DiffDescriptions() {
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
