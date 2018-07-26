/**
 * External dependencies
 */
import { mapValues, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Module constants
 */
let apiSettings = {};

/**
 * Do not use this API, it's only here while we deprecated withAPIData.
 *
 * @param {Object} schema
 * @param {Object} postTypeRestBaseMapping
 * @param {Object} taxonomyRestBaseMapping
 */
// eslint-disable-next-line camelcase
export const unstable__setApiSettings = ( schema, postTypeRestBaseMapping, taxonomyRestBaseMapping ) => {
	apiSettings = {
		schema,
		postTypeRestBaseMapping,
		taxonomyRestBaseMapping,
	};
};

export default class APIProvider extends Component {
	getChildContext() {
		return mapValues( {
			getAPISchema: 'schema',
			getAPIPostTypeRestBaseMapping: 'postTypeRestBaseMapping',
			getAPITaxonomyRestBaseMapping: 'taxonomyRestBaseMapping',
		}, ( key ) => () => apiSettings[ key ] );
	}

	render() {
		return this.props.children;
	}
}

APIProvider.childContextTypes = {
	getAPISchema: noop,
	getAPIPostTypeRestBaseMapping: noop,
	getAPITaxonomyRestBaseMapping: noop,
};
