/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PrivateBlockPopover } from '../block-popover';
import { store as blockEditorStore } from '../../store';
import { deviceTypeKey } from '../../store/private-keys';
import { unlock } from '../../lock-unlock';
import { getBlockVisibilityCondition } from './utils';

/**
 * While a ghosted block is selected it renders at full opacity, so this
 * popover explains why the block is hidden in the previewed context and
 * links to the block's visibility settings.
 *
 * @param {Object} props                      Props.
 * @param {string} props.clientId             Selected block client ID.
 * @param {Object} props.__unstableContentRef Ref holding the content scroll container.
 */
export default function GhostReasonPopover( {
	clientId,
	__unstableContentRef,
} ) {
	const { condition, canEditVisibility } = useSelect(
		( select ) => {
			const {
				getSettings,
				getBlockAttributes,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const { isBlockGhosted } = unlock( select( blockEditorStore ) );
			if (
				getSelectedBlockClientId() !== clientId ||
				! isBlockGhosted( clientId )
			) {
				return { condition: null };
			}
			const settings = getSettings();
			return {
				condition: getBlockVisibilityCondition(
					getBlockAttributes( clientId )?.metadata?.blockVisibility,
					settings[ deviceTypeKey ]?.toLowerCase() || 'desktop',
					settings.__experimentalFeatures?.viewport
				),
				canEditVisibility:
					settings.__experimentalFeatures?.blockVisibility
						?.allowEditing ?? true,
			};
		},
		[ clientId ]
	);
	const dispatch = useDispatch( blockEditorStore );

	if ( ! condition ) {
		return null;
	}

	const { showViewportModal } = unlock( dispatch );

	return (
		<PrivateBlockPopover
			clientId={ clientId }
			__unstableContentRef={ __unstableContentRef }
			className="block-editor-block-visibility__ghost-reason-popover"
			placement="bottom-start"
			focusOnMount={ false }
			resize={ false }
		>
			<div className="block-editor-block-visibility__ghost-reason">
				<span>{ condition.label }</span>
				{ canEditVisibility && (
					<Button
						size="small"
						variant="link"
						onClick={ () => showViewportModal( [ clientId ] ) }
					>
						{ __( 'Change visibility…' ) }
					</Button>
				) }
			</div>
		</PrivateBlockPopover>
	);
}
