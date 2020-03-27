/**
 * Internal dependencies
 */
import { linearToNestedList, updateHeadingBlockAnchors } from './utils';
import ListLevel from './ListLevel';

export default function save( props ) {
	const { attributes } = props;
	const { headings } = attributes;

	if ( headings.length === 0 ) {
		return null;
	}

	Utils.updateHeadingBlockAnchors();
	return (
		<nav className={ props.className }>
			<ListLevel>
				{ Utils.linearToNestedHeadingList( headings ) }
			</ListLevel>
		</nav>
	);
}
