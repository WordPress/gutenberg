/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { latex, mathML } = attributes;

	if ( ! latex ) {
		return null;
	}

	return (
		<div { ...useBlockProps.save() }>
			<math
				display="block"
				dangerouslySetInnerHTML={ { __html: mathML } }
			/>
		</div>
	);
}
