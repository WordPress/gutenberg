export default function PreferencesModalSection( {
	description,
	title,
	children,
} ) {
	return (
		<section className="interface-preferences-modal__section">
			<h2 className="interface-preferences-modal__section-title">
				{ title }
			</h2>
			{ description && (
				<p className="interface-preferences-modal__section-description">
					{ description }
				</p>
			) }
			{ children }
		</section>
	);
}
