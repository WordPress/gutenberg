/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getOrder, useOrderObserver } from './order';

export default function FootnotesEdit( {
	clientId,
	attributes,
	setAttributes,
} ) {
	return (
		<footer { ...useBlockProps( { ref: useOrderObserver( clientId ) } ) }>
			<ol>
				{ getOrder( clientId, attributes ).map( ( { id, content } ) => (
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
