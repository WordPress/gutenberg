/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const summary = attributes.summary ? attributes.summary : 'Details';
	return (
		<summary { ...useBlockProps.save() }>
			<RichText.Content value={ summary } />
		</summary>
	);
}
