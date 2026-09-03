import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/code', 'core/paragraph', 'core/verse' ],
			transform: ( { content, anchor } ) =>
				createBlock( 'core/preformatted', {
					content,
					anchor,
				} ),
		},
		{
			// The declared selector claims every <pre> and leaves the Code block,
			// which is tried first, to take the ones it can. That is as close as a
			// selector gets: CSS cannot say that a <pre> holds nothing but a
			// <code>, which is the line between the two blocks.
			name: 'from-raw',
			type: 'raw',
			// The exact negation of the Code block's isMatch, so that every
			// <pre> lands on one of the two: a <code> that is the whole of
			// the <pre> — its only element child, with only blank text
			// around it — belongs to Code, everything else here.
			isMatch: ( node ) =>
				node.nodeName === 'PRE' &&
				! (
					node.children.length === 1 &&
					node.firstElementChild.nodeName === 'CODE' &&
					! Array.from( node.childNodes ).some(
						( child ) =>
							child.nodeType === child.TEXT_NODE &&
							child.textContent.trim()
					)
				),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				createBlock( 'core/paragraph', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( attributes ) => createBlock( 'core/code', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'core/verse' ],
			transform: ( attributes ) =>
				createBlock( 'core/verse', attributes ),
		},
	],
};

export default transforms;
