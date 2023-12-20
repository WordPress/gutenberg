/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
/**
 * Internal dependencies
 */
import type { FlexDirection } from '../flex/types';
import type { HStackAlignment, AlignmentProps, Alignments } from './types';
import { isValueDefined } from '../utils/values';

const H_ALIGNMENTS: Alignments = {
	bottom: { align: 'flex-end', justify: 'center' },
	bottomLeft: { align: 'flex-end', justify: 'flex-start' },
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

const V_ALIGNMENTS: Alignments = {
	bottom: { justify: 'flex-end', align: 'center' },
	bottomLeft: { justify: 'flex-end', align: 'flex-start' },
	bottomRight: { justify: 'flex-end', align: 'flex-end' },
	center: { justify: 'center', align: 'center' },
	edge: { justify: 'space-between', align: 'center' },
	left: { justify: 'center', align: 'flex-start' },
	right: { justify: 'center', align: 'flex-end' },
	stretch: { align: 'stretch' },
	top: { justify: 'flex-start', align: 'center' },
	topLeft: { justify: 'flex-start', align: 'flex-start' },
	topRight: { justify: 'flex-start', align: 'flex-end' },
};

export function getAlignmentProps(
	alignment: HStackAlignment | CSSProperties[ 'alignItems' ],
	direction: FlexDirection = 'row'
): AlignmentProps {
	if ( ! isValueDefined( alignment ) ) {
		return {};
	}
	const isVertical = direction === 'column';
	const props = isVertical ? V_ALIGNMENTS : H_ALIGNMENTS;

	const alignmentProps =
		alignment in props
			? props[ alignment as keyof typeof props ]
			: { align: alignment };

	return alignmentProps;
}
