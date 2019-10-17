/**
 * WordPress dependencies
 */
import { escapeEditableHTML } from '@wordpress/escape-html';

/**
 * Internal dependencies
 */
import { escape } from './utils';

export default function save( { attributes } ) {
	return <pre><code>{ escape( escapeEditableHTML( attributes.content ) ) }</code></pre>;
}
