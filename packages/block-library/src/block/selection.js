/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

class ReusableBlockSelection extends Component {
	componentDidUpdate( prevProps ) {
		const {
			isReusableBlockSelected,
			hasSelection,
			clearSelectedBlock,
			onBlockSelection,
		} = this.props;

		if ( ! isReusableBlockSelected && prevProps.isReusableBlockSelected ) {
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
] )( ReusableBlockSelection );
