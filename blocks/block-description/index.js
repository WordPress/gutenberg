/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { deprecated } from '@wordpress/utils';
/**
 * Internal dependencies
 */
import './style.scss';

class BlockDescription extends Component {
	constructor() {
		super( ...arguments );
		deprecated( 'The wp.blocks.BlockDescription component', {
			version: '2.4',
			alternative: 'the "description" block property',
			plugin: 'Gutenberg',
		} );
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
