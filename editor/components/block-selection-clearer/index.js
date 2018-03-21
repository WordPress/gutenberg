/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

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
		const { hasSelectedBlock, clearSelectedBlock } = this.props;
		if ( event.target === this.container && hasSelectedBlock ) {
			clearSelectedBlock();
		}
	}

	render() {
		const { ...props } = this.props;

		return (
			<div
				tabIndex={ -1 }
				onFocus={ this.clearSelectionIfFocusTarget }
				ref={ this.bindContainer }
				{ ...omit( props, [ 'clearSelectedBlock', 'hasSelectedBlock' ] ) }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { hasSelectedBlock } = select( 'core/editor' );

		return {
			hasSelectedBlock: hasSelectedBlock(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock } = dispatch( 'core/editor' );
		return { clearSelectedBlock };
	} ),
] )( BlockSelectionClearer );
