/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';

const Section = ( { description, title, children } ) => {
	const content = renderToString( children );
	if ( ! content ) return null;
	return (
		<section className="edit-post-preferences-modal__section">
			<h2 className="edit-post-preferences-modal__section-title">
				{ title }
			</h2>
			{ description && (
				<p className="edit-post-preferences-modal__section-description">
					{ description }
				</p>
			) }
			{ children }
		</section>
	);
};

export default Section;
