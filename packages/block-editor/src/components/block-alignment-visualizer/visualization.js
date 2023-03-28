/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ALIGNMENT_LABELS = {
	content: __( 'Content width' ),
	wide: __( 'Wide width' ),
	full: __( 'Full width' ),
};

/**
 * Renders a visualization of block alignments.
 *
 * @param {Object}                  props
 * @param {string}                  props.contentSize          The CSS value for content size (e.g. 600px).
 * @param {string}                  props.wideSize             The CSS value for wide size (e.g. 80%).
 * @param {'none'|'wide'|'full'[]}  props.alignments           An array of the alignments to render.
 * @param {'left'|'right'|'center'} props.justification        The justification.
 * @param {string}                  props.highlightedAlignment The name of the highlighted alignment.
 */
export default function Visualization( {
	contentSize,
	wideSize,
	alignments,
	justification,
	highlightedAlignment,
} ) {
	return (
		<>
			<style>
				{ `
					.block-editor-alignment-visualizer__visualization-container {
						--content-size: ${ contentSize ?? '0px' };
						--wide-size: ${ wideSize ?? '0px' };
						--gap: 8px;
						--wide-segment-width: calc( ((var(--wide-size) - var(--content-size)) / 2) - var(--gap) );

						container: visualization / inline-size;
						position: absolute;
						display: block;
						width: 100%;
						height: 100%;
					}

					.block-editor-alignment-visualizer__visualization {
						position: absolute;
						width: 100%;
						height: 100%;
						display: grid;
						gap: var(--gap);
						grid-template-columns: 1fr var(--wide-segment-width) var(--content-size) var(--wide-segment-width) 1fr;
					}

					.block-editor-alignment-visualizer__visualization-segment {
						position: relative;
						background: rgba(61, 90, 242, 0.2);
						border-radius: 2px;
					}

					.block-editor-alignment-visualizer__visualization-segment-label {
						position: absolute;
						top: -32px;
						right: 0px;
						background: rgba( 0, 0, 0, 0.8 );
						border-radius: 2px;
						color: white;
						font-size: 12px;
						min-width: 32px;
						opacity: 0;
						padding: 4px 8px;
						pointer-events: none;
						text-align: center;
						transition: opacity 120ms ease;
						user-select: none;
						line-height: 1.4;
					}

					.block-editor-alignment-visualizer__visualization-segment-label.is-highlighted {
						opacity: 1;
					}

					/* Hide wide width alignments when the container is smaller than wide size */
					@container visualization (max-width: ${ wideSize ?? '0px' }) {
						.block-editor-alignment-visualizer__visualization {
							grid-template-columns: 1fr var(--content-size) 1fr;
						}

						.block-editor-alignment-visualizer__visualization-segment.wide-width {
							display: none;
						}
					}

					/* Hide both wide and full width alignments when the container is smaller than content size. */
					@container visualization (max-width:  ${ contentSize ?? '0px' }) {
						.block-editor-alignment-visualizer__visualization {
							grid-template-columns: 1fr;
						}

						.block-editor-alignment-visualizer__visualization-segment.wide-width,
						.block-editor-alignment-visualizer__visualization-segment.full-width {
							display: none;
						}
					}

					/* Hide right side segments when content justification is right */
					.block-editor-alignment-visualizer__visualization.is-content-justification-right {
						--wide-segment-width: calc( (var(--wide-size) - var(--content-size)) - var(--gap) );
						grid-template-columns: 1fr var(--wide-segment-width) var(--content-size);
					}

					.block-editor-alignment-visualizer__visualization.is-content-justification-right .right-side {
						display: none;
					}

					/* Hide left side segments when content justification is left */
					.block-editor-alignment-visualizer__visualization.is-content-justification-left {
						--wide-segment-width: calc( (var(--wide-size) - var(--content-size)) - var(--gap) );
						grid-template-columns: var(--content-size) var(--wide-segment-width) 1fr;
					}

					.block-editor-alignment-visualizer__visualization.is-content-justification-left .left-side {
						display: none;
					}
				` }
			</style>
			<div className="block-editor-alignment-visualizer__visualization-container">
				<div
					className={ classnames(
						'block-editor-alignment-visualizer__visualization',
						{
							[ `is-content-justification-${ justification }` ]:
								justification,
						}
					) }
				>
					{ [ ...alignments ]
						.reverse()
						.map(
							( { name } ) =>
								( name === 'full' || name === 'wide' ) && (
									<VisualizationSegment
										key={ `${ name }-left` }
										alignment={ name }
										side="left"
									/>
								)
						) }
					<VisualizationSegment
						alignment="content"
						isHighlighted={ highlightedAlignment === 'none' }
					/>
					{ alignments.map(
						( { name } ) =>
							( name === 'full' || name === 'wide' ) && (
								<VisualizationSegment
									key={ `${ name }-right` }
									alignment={ name }
									side="right"
									isHighlighted={
										highlightedAlignment === name
									}
								/>
							)
					) }
				</div>
			</div>
		</>
	);
}

function VisualizationSegment( { side, alignment, isHighlighted } ) {
	const label = ALIGNMENT_LABELS[ alignment ];

	return (
		<div
			className={ classnames(
				'block-editor-alignment-visualizer__visualization-segment',
				`${ alignment }-width`,
				{ [ `${ side }-side` ]: side }
			) }
		>
			{ !! label && (
				<div
					className={ classnames(
						'block-editor-alignment-visualizer__visualization-segment-label',
						{
							'is-highlighted': isHighlighted,
						}
					) }
				>
					{ label }
				</div>
			) }
		</div>
	);
}
