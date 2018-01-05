/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.scss';

class BlockDescription extends Component {
	constructor() {
		super( ...arguments );
		// eslint-disable-next-line no-console
		console.warn( 'The wp.blocks.BlockDescription component is deprecated. Use the "description" block property instead.' );
	}

	render() {
		const { children } = this.props;
		return (
			<div className="components-block-description">
				{ children }
			</div>
		);
	}
}

export default BlockDescription;
