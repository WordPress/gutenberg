export const WIDE_ALIGNMENTS = {
	alignments: {
		wide: 'wide',
		full: 'full',
	},
	// `innerContainers`: Group of blocks based on `InnerBlocks` component,
	// used to nest other blocks inside
	innerContainers: [
		'core/group',
		'core/columns',
		'core/column',
		'core/buttons',
		'core/button',
	],
	excludeBlocks: [ 'core/heading' ],
};

export const ALIGNMENT_BREAKPOINTS = {
	wide: 1024,
	large: 820,
	medium: 768,
	small: 680,
	mobile: 480,
};

const isFullWidth = ( align ) => align === WIDE_ALIGNMENTS.alignments.full;

const isWideWidth = ( align ) => align === WIDE_ALIGNMENTS.alignments.wide;

const isWider = ( width, breakpoint ) =>
	width > ALIGNMENT_BREAKPOINTS[ breakpoint ];

const isContainerRelated = ( blockName ) =>
	WIDE_ALIGNMENTS.innerContainers.includes( blockName );

export const alignmentHelpers = {
	isFullWidth,
	isWideWidth,
	isWider,
	isContainerRelated,
};
