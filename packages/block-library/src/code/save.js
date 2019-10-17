/**
 * Internal dependencies
 */
import { escape } from './utils';

export default function save( { attributes } ) {
	return <pre><code>{ escape( attributes.content ) }</code></pre>;
}
