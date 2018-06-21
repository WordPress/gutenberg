/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

class SharedBlockSelection extends Component {
	componentDidUpdate( prevProps ) {
		const {
			isSharedBlockSelected,
			hasSelection,
			clearSelectedBlock,
			onBlockSelection,
		} = this.props;

		if ( ! isSharedBlockSelected && prevProps.isSharedBlockSelected ) {
			clearSelectedBlock();
		}

		if ( hasSelection && ! prevProps.hasSelection ) {
			onBlockSelection();
		}
	}

	render() {
		return this.props.children;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getBlockSelectionStart } = select( 'core/editor' );

		return {
			hasSelection: !! getBlockSelectionStart(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock } = dispatch( 'core/editor' );
		return { clearSelectedBlock };
	} ),
] )( SharedBlockSelection );
