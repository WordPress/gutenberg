/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';

function BlockHasDot( {
	parentReusableBlockHasEdits,
	selectedReusableBlockHasEdits,
} ) {
	return (
		<>
			{ /* Add dot to the BlockParentSelector, if the parent block is reusable block and if the parent reusable block has edits */ }
			<Fill name="parent-selector-has-dot">
				{ ( { setReusableBlockHasEdits } ) =>
					parentReusableBlockHasEdits
						? setReusableBlockHasEdits( true )
						: setReusableBlockHasEdits( false )
				}
			</Fill>
			{ /* Move BlockContextualToolbar to right, if the parent block is reusable block and if the parent reusable block has edits */ }
			<Fill name="move-block-contextual-toolbar">
				{ ( { setMoveContextualToolbar } ) =>
					parentReusableBlockHasEdits
						? setMoveContextualToolbar( true )
						: setMoveContextualToolbar( false )
				}
			</Fill>
			{ /* Add dot before the switcher of Reusable block toolbar, if reusable block has edits */ }
			<Fill name="reusable-block-toolbar-has-dot">
				{ ( { setReusableBlockHasDot } ) =>
					selectedReusableBlockHasEdits
						? setReusableBlockHasDot( true )
						: setReusableBlockHasDot( false )
				}
			</Fill>
		</>
	);
}

export default BlockHasDot;
