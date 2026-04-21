/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

const ALIGNMENTS = {
	bottom: { alignItems: 'flex-end', justifyContent: 'center' },
	bottomLeft: { alignItems: 'flex-start', justifyContent: 'flex-end' },
	bottomRight: { alignItems: 'flex-end', justifyContent: 'flex-end' },
	center: { alignItems: 'center', justifyContent: 'center' },
	spaced: { alignItems: 'center', justifyContent: 'space-between' },
	left: { alignItems: 'center', justifyContent: 'flex-start' },
	right: { alignItems: 'center', justifyContent: 'flex-end' },
	stretch: { alignItems: 'stretch' },
	top: { alignItems: 'flex-start', justifyContent: 'center' },
	topLeft: { alignItems: 'flex-start', justifyContent: 'flex-start' },
	topRight: { alignItems: 'flex-start', justifyContent: 'flex-end' },
};

export function getAlignmentProps( alignment?: keyof typeof ALIGNMENTS ): {
	alignItems?: CSSProperties[ 'alignItems' ];
	justifyContent?: CSSProperties[ 'justifyContent' ];
} {
	const alignmentProps = alignment ? ALIGNMENTS[ alignment ] : {};

	return alignmentProps;
}
