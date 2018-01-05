/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { getBlocks } from '../../store/selectors';

function DocumentOutlineCheck( { blocks, children } ) {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

	if ( headings.length < 1 ) {
		return null;
	}

	return children;
}

export default connect(
	( state ) => ( {
		blocks: getBlocks( state ),
	} )
)( DocumentOutlineCheck );
