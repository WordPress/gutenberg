/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

export default function templateContentSave( { attributes: { content } } ) {
	return <RawHTML>{ content }</RawHTML>;
}
