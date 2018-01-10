/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import MetaBoxesArea from './meta-boxes-area';
import MetaBoxesPanel from './meta-boxes-panel';
import { getMetaBox } from '../../store/selectors';

function MetaBoxes( { location, isActive, usePanel = false } ) {
	if ( ! isActive ) {
		return null;
	}

	const element = <MetaBoxesArea location={ location } />;

	if ( ! usePanel ) {
		return element;
	}

	return (
		<MetaBoxesPanel>
			{ element }
		</MetaBoxesPanel>
	);
}

export default connect( ( state, ownProps ) => ( {
	isActive: getMetaBox( state, ownProps.location ).isActive,
} ) )( MetaBoxes );
