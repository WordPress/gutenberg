/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { useRefEffect } from '@wordpress/compose';

export default function FootnotesEdit( { attributes, setAttributes } ) {
	const ref = useRefEffect( ( node ) => {
		const { ownerDocument } = node;
		function onClick( event ) {
			const { target } = event;
			if ( target.nodeName !== 'A' ) return;
			if ( target.isContentEditable ) return;

			const id = target.getAttribute( 'href' ).replace( '#', '' );
			ownerDocument.getElementById( id )?.focus();
			event.preventDefault();
		}
		ownerDocument.addEventListener( 'click', onClick );
		return () => {
			ownerDocument.removeEventListener( 'click', onClick );
		};
	}, [] );

	return (
		<footer { ...useBlockProps( { ref } ) }>
			<ol>
				{ attributes.footnotes.map( ( { id, content } ) => (
					<li key={ id }>
						<RichText
							id={ id }
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
