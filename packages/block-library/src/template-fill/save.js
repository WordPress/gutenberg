/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

export default function save( { attributes: { content } } ) {
	return <RawHTML>{ content }</RawHTML>;
}
