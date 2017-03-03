/**
 * External dependencies
 */
import { createElement } from 'wp-elements';

export default function RawRenderer( { content } ) {
	return (
		<div dangerouslySetInnerHTML={ { __html: content } } />
	);
}
