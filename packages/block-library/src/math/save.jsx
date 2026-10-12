import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { latex, mathML } = attributes;

	if ( ! latex ) {
		return null;
	}

	// The LaTeX source lives in the `<annotation>` inside the MathML, where
	// it is HTML-escaped, so `wp_kses` leaves characters such as `&` and `<`
	// alone. Until the source renders, save it on its own: with the
	// annotation as the only child of `<semantics>`, browsers display the
	// source text.
	return (
		<div { ...useBlockProps.save() }>
			{ mathML ? (
				<math
					display="block"
					dangerouslySetInnerHTML={ { __html: mathML } }
				/>
			) : (
				<math display="block">
					<semantics>
						{ /* eslint-disable-next-line react/no-unknown-property -- MathML attribute. */ }
						<annotation encoding="application/x-tex">
							{ latex }
						</annotation>
					</semantics>
				</math>
			) }
		</div>
	);
}
