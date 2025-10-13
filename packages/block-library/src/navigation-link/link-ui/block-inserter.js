/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import DialogWrapper from './dialog-wrapper';
import { unlock } from '../../lock-unlock';

const { PrivateQuickInserter: QuickInserter } = unlock(
	blockEditorPrivateApis
);

/**
 * Component for inserting blocks within the Navigation Link UI.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.clientId      Client ID of the navigation link block.
 * @param {Function} props.onBack        Callback when user wants to go back.
 * @param {Function} props.onBlockInsert Callback when a block is inserted.
 */
function LinkUIBlockInserter( { clientId, onBack, onBlockInsert } ) {
	const { rootBlockClientId } = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );

			return {
				rootBlockClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	if ( ! clientId ) {
		return null;
	}

	return (
		<DialogWrapper
			className="link-ui-block-inserter"
			title={ __( 'Add block' ) }
			description={ __( 'Choose a block to add to your Navigation.' ) }
			onBack={ onBack }
		>
			<QuickInserter
				rootClientId={ rootBlockClientId }
				clientId={ clientId }
				isAppender={ false }
				prioritizePatterns={ false }
				selectBlockOnInsert={ ! onBlockInsert }
				onSelect={ onBlockInsert ? onBlockInsert : undefined }
				hasSearch={ false }
			/>
		</DialogWrapper>
	);
}

export default LinkUIBlockInserter;
