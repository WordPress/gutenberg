/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockSwitcher from './';
import { getMultiSelectedBlockUids } from '../../store/selectors';

export function MultiBlocksSwitcher( { isMultiBlockSelection, selectedBlockUids } ) {
	if ( ! isMultiBlockSelection ) {
		return null;
	}
	return (
		<BlockSwitcher key="switcher" uids={ selectedBlockUids } />
	);
}

export const mapStateToProps = ( state ) => {
	const selectedBlockUids = getMultiSelectedBlockUids( state );
	return {
		isMultiBlockSelection: selectedBlockUids.length > 1,
		selectedBlockUids,
	};
};

export default connect(
	mapStateToProps
)( MultiBlocksSwitcher );
