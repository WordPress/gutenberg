/**
 * External dependencies
 */
import { isFunction } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormToggle from '../form-toggle';
import BaseControl from '../base-control';

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
		const { label, checked, help, instanceId, className } = this.props;
		const id = `inspector-toggle-control-${ instanceId }`;

		let describedBy, helpLabel;
		if ( help ) {
			describedBy = id + '__help';
			helpLabel = isFunction( help ) ? help( checked ) : help;
		}

		return (
			<BaseControl
				id={ id }
				help={ helpLabel }
				className={ classnames( 'components-toggle-control', className ) }
			>
				<FormToggle
					id={ id }
					checked={ checked }
					onChange={ this.onChange }
					aria-describedby={ describedBy }
				/>
				<label
					htmlFor={ id }
					className="components-toggle-control__label"
				>
					{ label }
				</label>
			</BaseControl>
		);
	}
}

export default withInstanceId( ToggleControl );
