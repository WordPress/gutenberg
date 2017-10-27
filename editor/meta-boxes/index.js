/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import MetaBoxesIframe from './meta-boxes-iframe';
import MetaBoxesPanel from './meta-boxes-panel';
import { getMetaBox } from '../selectors';

function MetaBox( { location, isActive } ) {
	if ( ! isActive ) {
		return null;
	}

	return (
		<MetaBoxesPanel>
			<MetaBoxesIframe location={ location } />
		</MetaBoxesPanel>
	);
}

export default connect( ( state, ownProps ) => ( {
	isActive: getMetaBox( state, ownProps.location ).isActive,
} ) )( MetaBox );
