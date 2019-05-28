/**
 * WordPress dependencies
 */
import {
	__experimentalAsyncModeProvider as AsyncModeProvider,
	useSelect,
} from '@wordpress/data';

const BlockAsyncModeProvider = ( { children, clientId } ) => {
	const isSyncModeForced = useSelect( ( select ) => {
		const {
			hasSelectedInnerBlock,
			isAncestorMultiSelected,
			isBlockMultiSelected,
			isBlockSelected,
		} = select( 'core/block-editor' );

		const isSelected = isBlockSelected( clientId );
		const isParentOfSelectedBlock = hasSelectedInnerBlock( clientId, true );
		const isPartOfMultiSelection = isBlockMultiSelected( clientId ) ||
			isAncestorMultiSelected( clientId );

		return isSelected || isParentOfSelectedBlock || isPartOfMultiSelection;
	} );

	return (
		<AsyncModeProvider value={ ! isSyncModeForced }>
			{ children }
		</AsyncModeProvider>
	);
};

export default BlockAsyncModeProvider;
