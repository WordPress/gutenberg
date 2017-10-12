/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	differenceWith,
	isEqual,
	pick,
	toPairs,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

const optionsModel = new wp.api.models.Settings();

let callTime;
export function fetchSiteOptions() {
	if ( ! callTime || Date.now() - callTime > 3000 ) {
		callTime = Date.now();
		return Promise.resolve( optionsModel.fetch() );
	}
	return Promise.reject();
}

export function saveSiteOptions( options ) {
	const newKeys = getChangedKeys( options, getSiteOptions() );
	const newOptions = pick( options, newKeys );
	return optionsModel.save( newOptions )
		.then( ( result ) => pick( result, newKeys ) );
}

export function getOptionUpdatedMessage( option ) {
	switch ( option ) {
		case 'description':
			return __( 'Site description updated!' );
	}
}

function getSiteOptions() {
	return optionsModel.attributes;
}

function getChangedKeys( newOptions, oldOptions ) {
	return differenceWith( toPairs( newOptions ), toPairs( oldOptions ), isEqual )
		.map( ( [ key ] ) => key );
}

export const QuerySiteOptions = connect(
	null,
	( dispatch ) => ( {
		requestSiteOptions() {
			dispatch( {
				type: 'RESET_SITE_OPTIONS',
			} );
		},
	} )
)( class extends Component {
	componentDidMount() {
		this.props.requestSiteOptions();
	}
	render() {
		return null;
	}
} );
