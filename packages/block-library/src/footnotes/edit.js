/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useRefEffect } from '@wordpress/compose';

export default function FootnotesEdit( { attributes, setAttributes } ) {
	const ref = useRefEffect(
		( element ) => {
			const { ownerDocument } = element;
			const { defaultView } = ownerDocument;
			const config = { childList: true, subtree: true };
			const observer = new defaultView.MutationObserver( () => {
				const newOrder = Array.from(
					ownerDocument.querySelectorAll( 'a.fn' )
				).map( ( node ) => {
					return node.getAttribute( 'href' ).slice( 1 );
				} );
				const currentOrder = attributes.footnotes.map(
					( footnote ) => footnote.id
				);

				if ( newOrder.join( '' ) === currentOrder.join( '' ) ) {
					return;
				}

				const newFootnotes = attributes.footnotes.filter( ( a ) => {
					return newOrder.indexOf( a.id ) !== -1;
				} );
				newFootnotes.sort( ( a, b ) => {
					return newOrder.indexOf( a.id ) - newOrder.indexOf( b.id );
				} );
				setAttributes( { footnotes: newFootnotes } );
			} );

			observer.observe( ownerDocument, config );
			return () => {
				observer.disconnect();
			};
		},
		[ attributes.footnotes ]
	);
	return (
		<footer { ...useBlockProps( { ref } ) }>
			<ol>
				{ attributes.footnotes.map( ( { id, content } ) => (
					<li id={ id } key={ id }>
						<RichText
							tagName="span"
							value={ content }
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
