/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseOption from './base';

class DeferredOption extends Component {
	constructor( { isChecked } ) {
		super( ...arguments );
		this.state = {
			isChecked,
		};
	}

	componentWillUnmount() {
		if ( this.state.isChecked !== this.props.isChecked ) {
			this.props.onChange( this.state.isChecked );
		}
	}

	render() {
		return (
			<BaseOption
				label={ this.props.label }
				isChecked={ this.state.isChecked }
				onChange={ ( isChecked ) => this.setState( { isChecked } ) }
			/>
		);
	}
}

export default DeferredOption;
