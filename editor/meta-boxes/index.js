/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';
import './meta-box-iframe.scss';
import MetaBoxIframe from './iframe.js';
import { handleMetaBoxReload, metaBoxStateChanged } from '../actions';
import { getMetaBox, isSavingPost } from '../selectors';

function MetaBox( {
	isActive,
	isDirty,
	isUpdating,
	isPostSaving,
	location,
	metaBoxReloaded,
	changedMetaBoxState,
} ) {
	if ( ! isActive ) {
		return null;
	}

	return (
		<MetaBoxIframe
			isActive={ isActive }
			isDirty={ isDirty }
			isUpdating={ isUpdating }
			isPostSaving={ isPostSaving }
			location={ location }
			metaBoxReloaded={ metaBoxReloaded }
			changedMetaBoxState={ changedMetaBoxState } />
	);
}

function mapStateToProps( state, ownProps ) {
	const metaBox = getMetaBox( state, ownProps.location );
	const { isActive, isDirty, isUpdating } = metaBox;

	return {
		isActive,
		isDirty,
		isUpdating,
		isPostSaving: isSavingPost( state ) ? true : false,
	};
}

function mapDispatchToProps( dispatch ) {
	return {
		// Used to set the reference to the MetaBox in redux, fired when the component mounts.
		metaBoxReloaded: ( location ) => dispatch( handleMetaBoxReload( location ) ),
		changedMetaBoxState: ( location, hasChanged ) => dispatch( metaBoxStateChanged( location, hasChanged ) ),
	};
}

export default connect( mapStateToProps, mapDispatchToProps )( MetaBox );
