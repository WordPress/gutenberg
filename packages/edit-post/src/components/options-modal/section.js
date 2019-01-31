const Section = ( { title, children } ) => (
	<section className="edit-post-options-modal__section">
		<h2 className="edit-post-options-modal__section-title">{ title }</h2>
		{ children }
	</section>
);

export default Section;
