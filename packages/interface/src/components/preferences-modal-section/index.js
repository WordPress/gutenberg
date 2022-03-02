const Section = ( { description, title, children } ) => (
	<fieldset className="interface-preferences-modal__section">
		<legend>
			<h2 className="interface-preferences-modal__section-title">
				{ title }
			</h2>
			{ description && (
				<p className="interface-preferences-modal__section-description">
					{ description }
				</p>
			) }
		</legend>
		{ children }
	</fieldset>
);

export default Section;
