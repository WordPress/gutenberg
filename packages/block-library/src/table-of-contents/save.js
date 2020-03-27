/**
 * Internal dependencies
 */
import { linearToNestedHeadingList } from './utils';
import ListLevel from './ListLevel';

export default function save( props ) {
	const { attributes } = props;
	const { headings } = attributes;

	if ( headings.length === 0 ) {
		return null;
	}

	return (
		<nav className={ props.className }>
			<ListLevel>{ linearToNestedHeadingList( headings ) }</ListLevel>
		</nav>
	);
}
