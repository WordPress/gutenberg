/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RichText from '../rich-text';

export default class BlockButton extends Component {
	render() {
		const newProps = { ...this.props };
		newProps.className += ' wp-element-button';

		if ( this.props.frontEnd ) {
			return <RichText.Content { ...newProps } />;
		}

		return <RichText { ...newProps } />;
	}
}
