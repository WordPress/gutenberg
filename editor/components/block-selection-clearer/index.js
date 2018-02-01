/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { clearSelectedBlock } from '../../store/actions';

class BlockSelectionClearer extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.onClick = this.onClick.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onClick( event ) {
		if ( event.target === this.container ) {
			this.props.clearSelectedBlock();
		}
	}

	render() {
		const { ...props } = this.props;

		// Disable reason: Clicking the canvas should clear the selection
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				onMouseDown={ this.onClick }
				onTouchStart={ this.onClick }
				ref={ this.bindContainer }
				{ ...omit( props, 'clearSelectedBlock' ) }
			/>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default connect(
	undefined,
	{
		clearSelectedBlock,
	},
)( BlockSelectionClearer );
