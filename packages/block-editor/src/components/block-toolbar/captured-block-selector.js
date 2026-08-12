import { ToolbarButton } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Tile shown at the end of a controls-capturing block's toolbar, displaying
 * the deepest selected inner block. Activating it temporarily expands the
 * selection's own toolbar and inspector controls.
 *
 * @param {Object}   props
 * @param {string[]} props.clientIds      The selected inner block client IDs.
 * @param {string}   props.parentClientId The controls-capturing block.
 *
 * @return {Component} Captured block selector.
 */
export default function CapturedBlockSelector( { clientIds, parentClientId } ) {
	const { expandBlockControls } = unlock( useDispatch( blockEditorStore ) );
	const blockInformation = useBlockDisplayInformation( clientIds[ 0 ] );
	const isSingle = clientIds.length === 1;

	const label = isSingle
		? sprintf(
				/* translators: %s: Name of the selected block. */
				__( 'Show block tools: %s' ),
				blockInformation?.title
		  )
		: sprintf(
				/* translators: %d: Number of selected blocks. */
				_n(
					'Show block tools: %d block',
					'Show block tools: %d blocks',
					clientIds.length
				),
				clientIds.length
		  );

	return (
		<div
			className="block-editor-captured-block-selector"
			key={ clientIds[ 0 ] }
		>
			<ToolbarButton
				className="block-editor-captured-block-selector__button"
				onClick={ () => expandBlockControls( parentClientId ) }
				label={ label }
				showTooltip
				icon={
					isSingle ? (
						<BlockIcon icon={ blockInformation?.icon } />
					) : (
						copy
					)
				}
			/>
		</div>
	);
}
