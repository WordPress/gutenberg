/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockAlignmentGuides } from './guide-context';

/**
 * Renders hidden guide elements that are used for calculating snapping.
 * Each guide has the same rect as a block would at the given alignment.
 *
 * @param {Object}                  props
 * @param {string}                  props.contentSize   The CSS value for content size (e.g. 600px).
 * @param {string}                  props.wideSize      The CSS value for wide size (e.g. 80%).
 * @param {'none'|'wide'|'full'[]}  props.alignments    An array of the alignments to render.
 * @param {'left'|'right'|'center'} props.justification The justification.
 */
export default function Guides( {
	contentSize,
	wideSize,
	alignments,
	justification,
} ) {
	return (
		<>
			<style>
				{ `
					.block-editor-alignment-visualizer__guides {
						--content-size: ${ contentSize ?? '0px' };
						--wide-size: ${ wideSize ?? '0px' };

						position: absolute;
						width: 100%;
						height: 100%;
					}

					.block-editor-alignment-visualizer__guide {
						visibility: hidden;
						position: absolute;
						height: 100%;
						margin: 0 auto;
					}

					.block-editor-alignment-visualizer__guide.none {
						left: calc( ( 100% - var(--content-size) ) / 2 );
						width: var(--content-size);
					}

					.block-editor-alignment-visualizer__guide.wide {
						left: calc( ( 100% - var(--wide-size) ) / 2 );
						width: var(--wide-size);
					}

					.block-editor-alignment-visualizer__guide.full {
						width: 100%;
					}

					.is-content-justification-left .block-editor-alignment-visualizer__guide {
						left: 0;
					}
					.is-content-justification-right .block-editor-alignment-visualizer__guide {
						left: auto;
						right: 0;
					}
				` }
			</style>
			<div
				className={ classnames(
					'block-editor-alignment-visualizer__guides',
					{
						[ `is-content-justification-${ justification }` ]:
							justification,
					}
				) }
			>
				{ alignments.map( ( { name } ) => (
					<Guide key={ name } alignment={ name } />
				) ) }
			</div>
		</>
	);
}

function Guide( { alignment } ) {
	const guides = useBlockAlignmentGuides();
	const updateGuideContext = useRefEffect(
		( node ) => {
			guides?.set( alignment, node );
			return () => {
				guides?.delete( alignment );
			};
		},
		[ alignment ]
	);

	return (
		<div
			ref={ updateGuideContext }
			className={ classnames(
				'block-editor-alignment-visualizer__guide',
				alignment
			) }
		/>
	);
}
