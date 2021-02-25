/**
 * External dependencies
 */
import { isNil } from 'lodash';

/** @type {import('./types').Alignments} */
const ALIGNMENTS = {
	bottom: { align: 'flex-end', justify: 'center' },
	bottomLeft: { align: 'flex-start', justify: 'flex-end' },
	bottomRight: { align: 'flex-end', justify: 'flex-end' },
	center: { align: 'center', justify: 'center' },
	edge: { align: 'center', justify: 'space-between' },
	left: { align: 'center', justify: 'flex-start' },
	right: { align: 'center', justify: 'flex-end' },
	stretch: { align: 'stretch' },
	top: { align: 'flex-start', justify: 'center' },
	topLeft: { align: 'flex-start', justify: 'flex-start' },
	topRight: { align: 'flex-start', justify: 'flex-end' },
};

/** @type {import('./types').Alignments} */
const V_ALIGNMENTS = {
	bottom: { justify: 'flex-end', align: 'center' },
	bottomLeft: { justify: 'flex-start', align: 'flex-end' },
	bottomRight: { justify: 'flex-end', align: 'flex-end' },
	center: { justify: 'center', align: 'center' },
	edge: { justify: 'space-between', align: 'center' },
	left: { justify: 'center', align: 'flex-start' },
	right: { justify: 'center', align: 'flex-end' },
	stretch: { justify: 'stretch' },
	top: { justify: 'flex-start', align: 'center' },
	topLeft: { justify: 'flex-start', align: 'flex-start' },
	topRight: { justify: 'flex-start', align: 'flex-end' },
};

/* eslint-disable jsdoc/valid-types */
/**
 * @param {import('./types').HStackAlignment | import('react').CSSProperties[ 'alignItems' ]} alignment Where to align.
 * @param {import('../flex/types').FlexDirection} [direction='row'] Direction to align.
 * @return {import('./types').AlignmentProps} Alignment props.
 */
/* eslint-enable jsdoc/valid-types */
export function getAlignmentProps( alignment, direction = 'row' ) {
	if ( isNil( alignment ) ) {
		return {};
	}
	const isVertical = direction === 'column';
	const props = isVertical ? V_ALIGNMENTS : ALIGNMENTS;

	const alignmentProps =
		alignment in props
			? props[ /** @type {keyof typeof ALIGNMENTS} */ ( alignment ) ]
			: { align: alignment };

	return alignmentProps;
}
