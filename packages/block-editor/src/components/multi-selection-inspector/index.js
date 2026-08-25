import { sprintf, _n } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { copy } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import BlockIcon from '../block-icon';
import { store as blockEditorStore } from '../../store';

export default function MultiSelectionInspector() {
	const { selectedBlockCount, totalBlockCount } = useSelect( ( select ) => {
		const {
			getSelectedBlockCount,
			getMultiSelectedBlockClientIds,
			getClientIdsOfDescendants,
		} = select( blockEditorStore );
		const count = getSelectedBlockCount();
		return {
			selectedBlockCount: count,
			totalBlockCount:
				count +
				getClientIdsOfDescendants( getMultiSelectedBlockClientIds() )
					.length,
		};
	}, [] );
	return (
		<Stack
			direction="row"
			align="center"
			justify="flex-start"
			gap="sm"
			className="block-editor-multi-selection-inspector__card"
		>
			<BlockIcon icon={ copy } showColors />
			<Stack direction="column">
				<div className="block-editor-multi-selection-inspector__card-title">
					{ sprintf(
						/* translators: %d: number of blocks */
						_n( '%d Block', '%d Blocks', selectedBlockCount ),
						selectedBlockCount
					) }
				</div>
				{ totalBlockCount > selectedBlockCount && (
					<div className="block-editor-multi-selection-inspector__card-description">
						{ sprintf(
							/* translators: %d: number of blocks including nested blocks */
							_n(
								'%d including nested block',
								'%d including nested blocks',
								totalBlockCount
							),
							totalBlockCount
						) }
					</div>
				) }
			</Stack>
		</Stack>
	);
}
