import { useBlockProps } from '@wordpress/block-editor';
import { getSourceOnlyMathML } from './utils';

export default function save( { attributes } ) {
	const { latex, mathML } = attributes;

	if ( ! latex ) {
		return null;
	}

	// The LaTeX source lives in the `<annotation>` inside the MathML, where
	// it is HTML-escaped, so `wp_kses` leaves characters such as `&` and `<`
	// alone. When nothing has been rendered yet, save the source on its own.
	return (
		<div { ...useBlockProps.save() }>
			<math
				display="block"
				dangerouslySetInnerHTML={ {
					__html: mathML || getSourceOnlyMathML( latex ),
				} }
			/>
		</div>
	);
}
