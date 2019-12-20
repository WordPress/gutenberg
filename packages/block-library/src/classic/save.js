/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

export default function save( { attributes } ) {
	const { content } = attributes;

	return <RawHTML>{ content }</RawHTML>;
}
