/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useRefEffect } from '@wordpress/compose';
import { useReducer } from '@wordpress/element';

export const order = new Map();

export default function FootnotesEdit( {
	clientId,
	attributes,
	setAttributes,
} ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );
	const ref = useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;
		const config = { childList: true, subtree: true };
		const observer = new defaultView.MutationObserver( () => {
			const newOrder = Array.from(
				ownerDocument.querySelectorAll( 'a.fn' )
			).map( ( node ) => {
				return node.getAttribute( 'href' ).slice( 1 );
			} );
			const footnotes = Object.fromEntries(
				attributes.footnotes.map( ( { content, id } ) => [
					id,
					content,
				] )
			);
			attributes.footnotes = newOrder.map( ( id ) => {
				return {
					content: footnotes[ id ],
					id,
				};
			} );
			forceRender();
		} );

		observer.observe( ownerDocument, config );
		return () => {
			observer.disconnect();
		};
	}, [] );
	const footnotes = Object.fromEntries(
		attributes.footnotes.map( ( { content, id } ) => [ id, content ] )
	);
	order.set(
		clientId,
		new Set( [
			...( order.get( clientId ) || [] ),
			...Object.keys( footnotes ),
		] )
	);
	return (
		<footer { ...useBlockProps( { ref } ) }>
			<ol>
				{ Array.from( order.get( clientId ) ).map( ( id ) => (
					<li id={ id } key={ id }>
						<RichText
							tagName="span"
							value={ footnotes[ id ] }
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
