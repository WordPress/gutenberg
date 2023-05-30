/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function FootnotesEdit( { attributes, setAttributes } ) {
	return (
		<footer { ...useBlockProps() }>
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
