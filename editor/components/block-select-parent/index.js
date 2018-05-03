/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { ifCondition, IconButton } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { getBlockFocusableWrapper } from '../../utils/dom';
import { __ } from '@wordpress/i18n';

export function BlockSelectParent( { selectRootBlock, onFocus, ...props } ) {
	const selectParentLabel = __( 'Select parent block' );
	const onFocusHandler = ( event ) => {
		if ( onFocus ) {
			onFocus( event );
		}
		// This is used for improved interoperability
		// with the block's `onFocus` handler which selects the block, thus conflicting
		// with the intention to select the root block.
		event.stopPropagation();
	};

	return (
		<IconButton
			onClick={ selectRootBlock }
			onFocus={ onFocusHandler }
			label={ selectParentLabel }
			icon="arrow-left-alt"
			{ ...omit( props, [ 'rootUID' ] ) }
		/>
	);
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getBlockRootUID } = select( 'core/editor' );
		const { uid } = ownProps;

		return {
			rootUID: getBlockRootUID( uid ),
		};
	} ),
	ifCondition( ( { rootUID } ) => rootUID ),
	withDispatch( ( dispatch, ownProps ) => {
		const { rootUID } = ownProps;
		const { selectBlock } = dispatch( 'core/editor' );

		return {
			selectRootBlock: () => {
				selectBlock( rootUID );
				const selectedBlockElement = getBlockFocusableWrapper( rootUID );
				selectedBlockElement.focus();
			},
		};
	} ),
] )( BlockSelectParent );
