/**
 * Internal dependencies
 */
import { linearToNestedHeadingList } from './utils';
import ListItem from './ListItem';

export default function save( props ) {
	const { attributes } = props;
	const { headings } = attributes;

	if ( headings.length === 0 ) {
		return null;
	}

	return (
		<nav className={ props.className }>
			<ListItem>{ linearToNestedHeadingList( headings ) }</ListItem>
		</nav>
	);
}
