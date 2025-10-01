/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return attributes.items?.length > 0 && <div { ...useBlockProps.save() } />;
}
