/**
 * Internal dependencies
 */
import * as Utils from './utils';
import ListLevel from './ListLevel';

export default function save( props ) {
	const { attributes, setAttributes } = props;
	const headings = attributes.headings;

	if ( headings.length === 0 ) {
		return null;
	}

	Utils.updateHeadingBlockAnchors();
	return (
		<nav className={ props.className }>
			<ListLevel
				edit={ false }
				attributes={ attributes }
				setAttributes={ setAttributes }
			>
				{ Utils.linearToNestedList( headings ) }
			</ListLevel>
		</nav>
	);
}
