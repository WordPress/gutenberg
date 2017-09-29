/**
 * External dependencies
 */
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import './metabox-iframe.scss';
import MetaboxIframe from './iframe.js';
import { handleMetaboxReload, metaboxStateChanged } from '../actions';
import { getMetabox } from '../selectors';

const renderMetabox = ( {
	isActive,
	isDirty,
	isUpdating,
	location,
	isSidebarOpened,
	id = 'gutenberg-metabox-iframe',
	metaboxReloaded,
	changedMetaboxState,
} ) => {
	if ( isActive === false ) {
		return null;
	}

	const classes = classnames( {
		'gutenberg-metabox-iframe': true,
		[ `${ location }` ]: true,
		'sidebar-open': isSidebarOpened,
	} );

	return (
		<MetaboxIframe
			isActive={ isActive }
			isDirty={ isDirty }
			isUpdating={ isUpdating }
			title={ __( 'Extended Settings' ) }
			key="metabox"
			id={ id }
			className={ classes }
			location={ location }
			metaboxReloaded={ metaboxReloaded }
			changedMetaboxState={ changedMetaboxState }
			src={ `${ window._wpMetaboxUrl }&metabox=${ location }` } />
	);
};

const Metabox = ( props ) => renderMetabox( props );

function mapStateToProps( state, ownProps ) {
	const metabox = getMetabox( state, ownProps.location );
	const { isActive, isDirty, isUpdating } = metabox;

	return {
		isActive,
		isDirty,
		isUpdating,
	};
}

function mapDispatchToProps( dispatch ) {
	return {
		// Used to set the reference to the Metabox in redux, fired when the component mounts.
		metaboxReloaded: ( location ) => dispatch( handleMetaboxReload( location ) ),
		changedMetaboxState: ( location, hasChanged ) => dispatch( metaboxStateChanged( location, hasChanged ) ),
	};
}

export default connect( mapStateToProps, mapDispatchToProps )( Metabox );
