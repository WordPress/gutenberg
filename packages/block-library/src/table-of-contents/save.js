/**
 * Internal dependencies
 */
import ListItem from './list-item';
import { linearToNestedHeadingList } from './utils';

export default function save( { attributes, className } ) {
	const { headings } = attributes;

	if ( headings.length === 0 ) {
		return null;
	}

	return (
		<nav className={ className }>
			<ListItem>{ linearToNestedHeadingList( headings ) }</ListItem>
		</nav>
	);
}
