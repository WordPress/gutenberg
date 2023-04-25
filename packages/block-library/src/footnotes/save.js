/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { order } from './edit';

export default function Save( { attributes, clientId } ) {
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
		<footer { ...useBlockProps.save() }>
			<ol>
				{ Array.from( order.get( clientId ) ).map( ( id ) => (
					<li id={ id } key={ id }>
						<RichText.Content
							tagName="span"
							value={ footnotes[ id ] }
						/>{ ' ' }
						<a href={ `#${ id }-link` }>↩︎</a>
					</li>
				) ) }
			</ol>
		</footer>
	);
}
