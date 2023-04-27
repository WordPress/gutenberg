/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getOrder } from './order';

export default function Save( { attributes, clientId } ) {
	return (
		<footer { ...useBlockProps.save() }>
			<ol>
				{ getOrder( clientId, attributes ).map( ( { id, content } ) => (
					<li id={ id } key={ id }>
						<RichText.Content tagName="span" value={ content } />{ ' ' }
						<a href={ `#${ id }-link` }>↩︎</a>
					</li>
				) ) }
			</ol>
		</footer>
	);
}
