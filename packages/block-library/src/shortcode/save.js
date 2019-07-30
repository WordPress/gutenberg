/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

export default function save( { attributes } ) {
	return <RawHTML>{ attributes.text }</RawHTML>;
}
