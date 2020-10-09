const Section = ( { title, children } ) => (
	<section className="edit-post-preferences-modal__section">
		<h2 className="edit-post-preferences-modal__section-title">
			{ title }
		</h2>
		{ children }
	</section>
);

export default Section;
