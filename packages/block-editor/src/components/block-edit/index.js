/**
 * External dependencies
 */
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider } from './context';

export default class BlockEdit extends Component {
	constructor() {
		super( ...arguments );

		// It is important to return the same object if props haven't changed
		// to avoid  unnecessary rerenders.
		// See https://reactjs.org/docs/context.html#caveats.
		this.propsToContext = memize(
			this.propsToContext.bind( this ),
			{ maxSize: 1 }
		);
	}

	propsToContext( name, isSelected, clientId, onFocus, onCaretVerticalPositionChange, attributes, setAttributes ) {
		return { name, isSelected, clientId, onFocus, onCaretVerticalPositionChange, attributes, setAttributes };
	}

	render() {
		const { name, isSelected, clientId, onFocus, onCaretVerticalPositionChange, attributes, setAttributes } = this.props;
		const value = this.propsToContext( name, isSelected, clientId, onFocus, onCaretVerticalPositionChange, attributes, setAttributes );

		return (
			<BlockEditContextProvider value={ value }>
				<Edit { ...this.props } />
			</BlockEditContextProvider>
		);
	}
}

export { BlockEditContextProvider };
export { default as useAttributePicker } from './use-attribute-picker';
