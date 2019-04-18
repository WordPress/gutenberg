/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, value, citation } = attributes;

	return (
		<blockquote style={ { textAlign: align ? align : null } }>
			<RichText.Content multiline value={ value } />
			{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
		</blockquote>
	);
}
