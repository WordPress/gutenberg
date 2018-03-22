/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

class BlockSelectionClearer extends Component {
	constructor() {
		super( ...arguments );

		this.bindContainer = this.bindContainer.bind( this );
		this.clearSelectionIfFocusTarget = this.clearSelectionIfFocusTarget.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	/**
	 * Clears the selected block on focus if the container is the target of the
	 * focus. This assumes no other descendents have received focus until event
	 * has bubbled to the container.
	 *
	 * @param {FocusEvent} event Focus event.
	 */
	clearSelectionIfFocusTarget( event ) {
		if ( event.target === this.container ) {
			this.props.clearSelectedBlock();
		}
	}

	render() {
		const { ...props } = this.props;

		return (
			<div
				tabIndex={ -1 }
				onFocus={ this.clearSelectionIfFocusTarget }
				ref={ this.bindContainer }
				{ ...omit( props, 'clearSelectedBlock' ) }
			/>
		);
	}
}

export default withDispatch( ( dispatch ) => {
	const { clearSelectedBlock } = dispatch( 'core/editor' );
	return { clearSelectedBlock };
} )( BlockSelectionClearer );
