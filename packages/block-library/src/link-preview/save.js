/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { Content } from './content';

export default function save( { attributes } ) {
	if ( ! attributes.url ) {
		return null;
	}

	return <Content props={ useBlockProps.save() } attributes={ attributes } />;
}
