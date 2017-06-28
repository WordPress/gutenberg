/**
 * WordPress dependencies
 */
import { Component } from 'element';

/**
 * Internal dependencies
 */
import './style.scss';

class BlockDescription extends Component {
	render() {
		return (
			<div className="components-block-description">
				{ this.props.children }
			</div>
		);
	}
}

export default BlockDescription;
