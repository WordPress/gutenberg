/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import FormToggle from '../form-toggle';
import withInstanceId from '../higher-order/with-instance-id';

/**
 * Internal dependencies
 */
import BaseControl from './../base-control';
import './style.scss';

class ToggleControl extends Component {
	constructor() {
		super( ...arguments );

		this.onChange = this.onChange.bind( this );
	}

	onChange( event ) {
		if ( this.props.onChange ) {
			this.props.onChange( event.target.checked );
		}
	}

	render() {
		const { label, checked, help, checkedHelp, instanceId } = this.props;
		const id = `inspector-toggle-control-${ instanceId }`;

		// allow customizing the help text based on checked state
		let helpLabel = help;
		if ( checkedHelp ) {
			helpLabel = checked ? checkedHelp : help;
		}

		let describedBy;
		if ( help ) {
			describedBy = id + '__help';
		}

		return (
			<BaseControl
				label={ label }
				id={ id }
				help={ helpLabel }
				className="components-toggle-control"
			>
				<FormToggle
					id={ id }
					checked={ checked }
					onChange={ this.onChange }
					aria-describedby={ describedBy }
				/>
			</BaseControl>
		);
	}
}

export default withInstanceId( ToggleControl );
