/**
 * WordPress dependencies
 */
import { AsyncModeProvider, useSelect } from '@wordpress/data';

const BlockAsyncModeProvider = ( { children, clientId, isBlockInSelection } ) => {
	const isParentOfSelectedBlock = useSelect( ( select ) => {
		return select( 'core/block-editor' ).hasSelectedInnerBlock( clientId, true );
	}, [ clientId ] );

	const isSyncModeForced = isBlockInSelection || isParentOfSelectedBlock;

	return (
		<AsyncModeProvider value={ ! isSyncModeForced }>
			{ children }
		</AsyncModeProvider>
	);
};

export default BlockAsyncModeProvider;
