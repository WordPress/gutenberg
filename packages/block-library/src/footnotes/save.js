/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default function Save( { attributes } ) {
	const { footnotes } = attributes;

	if ( ! footnotes.length ) {
		return null;
	}

	return (
		<ol>
			{ footnotes.map( ( { id, text } ) =>
				<li key={ id }>
					<a
						id={ id }
						href={ `#${ id }-anchor` }
						aria-label={ __( 'Back to content' ) }
					>
						↑
					</a>
					{ ` ${ text }` }
				</li>
			) }
		</ol>
	);
}
