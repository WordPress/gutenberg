/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	return (
		<footer { ...useBlockProps.save() }>
			<ol>
				{ attributes.footnotes.map( ( { id, content } ) => (
					<li id={ id } key={ id }>
						<RichText.Content tagName="span" value={ content } />{ ' ' }
						<a href={ `#${ id }-link` }>↩︎</a>
					</li>
				) ) }
			</ol>
		</footer>
	);
}
