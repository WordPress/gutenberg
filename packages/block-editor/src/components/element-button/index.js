/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RichText from '../rich-text';

const getElementProps = ( props ) => {
	const newProps = { ...props };
	newProps.className += ' wp-element-button';
	return newProps;
};

export default class ElementButton extends Component {
	render() {
		const newProps = getElementProps( this.props );
		// If children are set then we only need a button, not RichText.
		if ( newProps.children ) {
			return <button { ...newProps } />;
		}

		return <RichText { ...newProps } />;
	}
}

ElementButton.Content = ( props ) => {
	const newProps = getElementProps( props );
	// If children are set then we only need a button, not RichText.
	if ( newProps.children ) {
		return <button { ...newProps } />;
	}

	return <RichText.Content { ...newProps } />;
};
