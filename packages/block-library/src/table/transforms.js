import { createBlock } from '@wordpress/blocks';
import { normalizeRowColSpan } from './utils';

const tableContentPasteSchema = ( { phrasingContentSchema } ) => ( {
	tr: {
		allowEmpty: true,
		children: {
			th: {
				allowEmpty: true,
				children: phrasingContentSchema,
				attributes: [ 'scope', 'colspan', 'rowspan', 'style' ],
			},
			td: {
				allowEmpty: true,
				children: phrasingContentSchema,
				attributes: [ 'colspan', 'rowspan', 'style' ],
			},
		},
	},
} );

const tablePasteSchema = ( args ) => {
	const { phrasingContentSchema, isPaste } = args;
	const table = {
		children: {
			caption: {
				children: phrasingContentSchema,
			},
			thead: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
			tfoot: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
			tbody: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
		},
	};

	return {
		table,
		// Raw tables already match the transform without a figure wrapper.
		...( isPaste && {
			figure: {
				require: [ 'table' ],
				children: {
					table,
					figcaption: {
						children: phrasingContentSchema,
					},
				},
			},
		} ),
	};
};

function isTable( node ) {
	if ( node.nodeName === 'TABLE' ) {
		return true;
	}

	return (
		node.nodeName === 'FIGURE' &&
		node.querySelectorAll( 'table' ).length === 1 &&
		node.querySelectorAll( 'figcaption' ).length <= 1 &&
		! (
			node.querySelector( 'figcaption' ) &&
			node.querySelector( 'table > caption' )
		) &&
		Array.from( node.childNodes ).every(
			( child ) =>
				child.nodeName === 'TABLE' ||
				child.nodeName === 'FIGCAPTION' ||
				( child.nodeName === 'FIGURE' && isTable( child ) ) ||
				( child.nodeType === child.TEXT_NODE &&
					! child.textContent.trim() )
		)
	);
}

const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: isTable,
			schema: tablePasteSchema,
			transform: ( node ) => {
				const table =
					node.nodeName === 'TABLE'
						? node
						: node.querySelector( 'table' );
				const figureCaption =
					node.nodeName === 'FIGURE'
						? Array.from(
								node.querySelectorAll( 'figcaption' )
							).find( ( element ) => ! table.contains( element ) )
						: null;
				const caption = figureCaption || table.caption;
				const attributes = Array.from( table.children ).reduce(
					( sectionAcc, section ) => {
						if (
							section.nodeName === 'CAPTION' ||
							! section.children.length
						) {
							return sectionAcc;
						}

						const sectionName = section.nodeName
							.toLowerCase()
							.slice( 1 );

						const sectionAttributes = Array.from(
							section.children
						).reduce( ( rowAcc, row ) => {
							if ( ! row.children.length ) {
								return rowAcc;
							}

							const rowAttributes = Array.from(
								row.children
							).reduce( ( colAcc, col ) => {
								const rowspan = normalizeRowColSpan(
									col.getAttribute( 'rowspan' )
								);
								const colspan = normalizeRowColSpan(
									col.getAttribute( 'colspan' )
								);

								const { textAlign } = col.style || {};

								let align;
								if (
									textAlign === 'left' ||
									textAlign === 'center' ||
									textAlign === 'right'
								) {
									align = textAlign;
								}

								colAcc.push( {
									tag: col.nodeName.toLowerCase(),
									content: col.innerHTML,
									rowspan,
									colspan,
									align,
								} );

								return colAcc;
							}, [] );

							rowAcc.push( {
								cells: rowAttributes,
							} );

							return rowAcc;
						}, [] );

						sectionAcc[ sectionName ] = sectionAttributes;
						return sectionAcc;
					},
					{ caption: caption?.innerHTML }
				);

				return createBlock( 'core/table', attributes );
			},
		},
	],
};

export default transforms;
