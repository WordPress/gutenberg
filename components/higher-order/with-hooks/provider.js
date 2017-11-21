/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import createHooks from '@wordpress/hooks';
import { Component } from '@wordpress/element';

export default class HooksProvider extends Component {
	constructor() {
		super( ...arguments );

		this.hooks = createHooks();
	}

	getChildContext() {
		const { hooks } = this;
		return { hooks };
	}

	render() {
		return this.props.children;
	}
}

HooksProvider.childContextTypes = {
	hooks: noop,
};
