/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Component which calls onBlockSelected prop when a block becomes selected. It
 * can be used to ensuring that only one block appears as selected
 * when multiple editors exist in a page.
 *
 * @type {WPComponent}
 */

class SelectionObserver extends Component {
	componentDidUpdate( prevProps ) {
		const {
			hasSelectedBlock,
			onBlockSelected,
			isSelectedArea,
			clearSelectedBlock,
		} = this.props;

		if ( hasSelectedBlock && ! prevProps.hasSelectedBlock ) {
			onBlockSelected();
		}

		if ( ! isSelectedArea && prevProps.isSelectedArea ) {
			clearSelectedBlock();
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { hasSelectedBlock } = select( 'core/block-editor' );

		return {
			hasSelectedBlock: hasSelectedBlock(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock } = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
		};
	} ),
] )( SelectionObserver );
