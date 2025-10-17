/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { latex, mathML } = attributes;

	if ( ! latex ) {
		return null;
	}

	if ( ! mathML ) {
		return <div { ...useBlockProps.save() }>{ latex }</div>;
	}

	return (
		<math
			{ ...useBlockProps.save() }
			display="block"
			dangerouslySetInnerHTML={ { __html: mathML } }
		/>
	);
}
