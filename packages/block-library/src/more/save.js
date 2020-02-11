/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';

export default function save( { attributes } ) {
	const { customText, noTeaser } = attributes;

	const moreTag = customText ? `<!--more ${ customText }-->` : '<!--more-->';

	const noTeaserTag = noTeaser ? '<!--noteaser-->' : '';

	return (
		<RawHTML>{ compact( [ moreTag, noTeaserTag ] ).join( '\n' ) }</RawHTML>
	);
}
