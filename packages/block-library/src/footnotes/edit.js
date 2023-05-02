/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	getRichTextValues,
} from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { createBlock } from '@wordpress/blocks';

addFilter(
	'blockEditor.higherOrderReducer',
	'core/footnotes',
	( state, reducer ) => {
		const blocks = state.tree.get( '' )?.innerBlocks;

		if ( ! blocks ) return state;

		const content = getRichTextValues( blocks ).join( '' );

		if ( ! content ) return state;
		if ( content.indexOf( 'data-fn' ) === -1 ) return state;

		// This can be avoided when
		// https://github.com/WordPress/gutenberg/pull/43204 lands. We can then
		// get the order directly from the rich text values.
		const regex = /data-fn="([^"]+)"/g;
		const newOrder = [];
		let match;
		while ( ( match = regex.exec( content ) ) !== null ) {
			newOrder.push( match[ 1 ] );
		}

		const fnBlock = Array.from( state.byClientId.values() ).find(
			( block ) => block.name === 'core/footnotes'
		);

		const currentOrder = fnBlock
			? state.attributes
					.get( fnBlock.clientId )
					.footnotes.map( ( fn ) => fn.id )
			: [];

		if ( currentOrder.join( '' ) === newOrder.join( '' ) ) return state;

		if ( ! fnBlock ) {
			const rootBlock = Array.from( state.byClientId.values() ).find(
				( block ) => block.name === 'core/post-content'
			);
			return reducer( state, {
				type: 'INSERT_BLOCKS',
				blocks: [ createBlock( 'core/footnotes', { footnotes: [] } ) ],
				rootClientId: rootBlock?.clientId,
			} );
		}

		return reducer( state, {
			type: 'UPDATE_BLOCK_ATTRIBUTES',
			clientIds: [ fnBlock.clientId ],
			attributes: {
				footnotes: newOrder.map( ( id ) => {
					return (
						state.attributes
							.get( fnBlock.clientId )
							.footnotes.find( ( fn ) => fn.id === id ) || {
							id,
							content: '',
						}
					);
				} ),
			},
		} );
	}
);

export default function FootnotesEdit( { attributes, setAttributes } ) {
	return (
		<footer { ...useBlockProps() }>
			<ol>
				{ attributes.footnotes.map( ( { id, content } ) => (
					<li id={ id } key={ id }>
						<RichText
							tagName="span"
							value={ content }
							identifier={ id }
							onChange={ ( nextFootnote ) => {
								setAttributes( {
									footnotes: attributes.footnotes.map(
										( footnote ) => {
											return footnote.id === id
												? {
														content: nextFootnote,
														id,
												  }
												: footnote;
										}
									),
								} );
							} }
						/>{ ' ' }
						<a href={ `#${ id }-link` }>↩︎</a>
					</li>
				) ) }
			</ol>
		</footer>
	);
}
