/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { unescape as unescapeString, reduce, map } from 'lodash';

function getChildElements( child ) {
	if ( child.value ) {
		return unescapeString( child.value );
	}

	let children;
	if ( child.children ) {
		children = map( child.children, getChildElements );
	}

	if ( 'HTML_Tag' === child.type ) {
		return createElement( child.name, child.attrs, children );
	}

	return children;
}

export default function TextBlockForm( { node } ) {
	const style = reduce( node.attrs, ( memo, value, key ) => {
		switch ( key ) {
			case 'align':
				memo[ 'text-align' ] = value;
				break;
		}

		return memo;
	}, {} );

	return (
		<p
			contentEditable
			style={ style }
			className="text-block__form">
			{ map( node.children, getChildElements ) }
		</p>
	);
}
