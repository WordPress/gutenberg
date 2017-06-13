/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';

class BaseControl extends Component {
	constructor( props ) {
		super( ...arguments );
		this.id = 'inspector-base-control-' + props.instanceId;
	}
	
	renderControlLabel() {
		const { label } = this.props;
		
		return label && (
			<label className="blocks-base-control__label" htmlFor={ this.id }>
				{ label }
			</label>
		);
	}
	
	renderControl() {
		// TODO: Render sub-class control.
		return;
	}
	
	render() {
		return (
			<div className="blocks-base-control">
				{ this.renderControlLabel() }
				{ this.renderControl() }
			</div>
		);
	}
}

export default withInstanceId( BaseControl );
