/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Renders a visualization of block alignments.
 *
 * @param {Object}                  props
 * @param {string}                  props.contentSize   The CSS value for content size (e.g. 600px).
 * @param {string}                  props.wideSize      The CSS value for wide size (e.g. 80%).
 * @param {'none'|'wide'|'full'[]}  props.alignments    An array of the alignments to render.
 * @param {'left'|'right'|'center'} props.justification The justification.
 */
export default function Visualization( {
	contentSize,
	wideSize,
	alignments,
	justification,
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
						background: #3d5af2;
						opacity: 0.2;
						border-radius: 2px;
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
					<VisualizationSegment alignment="content" />
					{ alignments.map(
						( { name } ) =>
							( name === 'full' || name === 'wide' ) && (
								<VisualizationSegment
									key={ `${ name }-right` }
									alignment={ name }
									side="right"
								/>
							)
					) }
				</div>
			</div>
		</>
	);
}

function VisualizationSegment( { side, alignment } ) {
	return (
		<div
			className={ classnames(
				'block-editor-alignment-visualizer__visualization-segment',
				`${ alignment }-width`,
				{ [ `${ side }-side` ]: side }
			) }
		/>
	);
}
