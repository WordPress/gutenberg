/**
 * External dependencies
 */
import { createElement } from 'wp-elements';

export default function RawRenderer( { content } ) {
	return (
		<div className="my-theme" dangerouslySetInnerHTML={ { __html: content } } />
	);
}
