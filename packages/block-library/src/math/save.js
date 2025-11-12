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
		<math
			{ ...useBlockProps.save() }
			display="block"
			dangerouslySetInnerHTML={ { __html: mathML } }
		/>
	);
}
