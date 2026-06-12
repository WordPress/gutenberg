/**
 * WordPress dependencies
 */
import {
	hasBlockSupport,
	isReusableBlock,
	serialize,
	getBlockType,
} from '@wordpress/blocks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { lock as lockIcon } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import CreatePatternModal from './create-pattern-modal';
import { PATTERN_SYNC_TYPES } from '../constants';
import { unlock } from '../lock-unlock';

const { BlockLockModalActionsSlotFill } = unlock( blockEditorPrivateApis );

/**
 * The control rendered inside the block lock modal. Returns `null` when the
 * selected block can't be turned into a pattern (e.g. it already is one), which
 * doubles as the answer to "what if you lock a pattern?" — the affordance
 * simply isn't offered because the design is already locked.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.clientId Client id of the block being locked.
 * @param {()=>void} props.onClick  Invoked when the user opts to lock the design.
 * @return {React.ComponentType|null} The control, or null.
 */
function LockDesignControl( { clientId, onClick } ) {
	const canConvert = useSelect(
		( select ) => {
			const { canUser, getEntityRecord } = select( coreStore );
			const { getBlock, canInsertBlockType, getBlockRootClientId } =
				select( blockEditorStore );

			const block = getBlock( clientId );

			// Already a pattern (synced or unsynced): the design is locked
			// already, so don't offer to lock it again.
			const isUnsyncedPattern =
				!! block?.attributes?.metadata?.patternName;
			const isSyncedPattern =
				!! block &&
				isReusableBlock( block ) &&
				!! getEntityRecord(
					'postType',
					'wp_block',
					block.attributes.ref
				);

			const blockType = block && getBlockType( block.name );
			const hasParent = blockType && 'parent' in blockType;

			return (
				!! block &&
				block.isValid &&
				! isUnsyncedPattern &&
				! isSyncedPattern &&
				hasBlockSupport( block.name, 'reusable', ! hasParent ) &&
				canInsertBlockType(
					'core/block',
					getBlockRootClientId( clientId )
				) &&
				!! canUser( 'create', {
					kind: 'postType',
					name: 'wp_block',
				} )
			);
		},
		[ clientId ]
	);

	if ( ! canConvert ) {
		return null;
	}

	return (
		<div className="block-editor-block-lock-modal__extra-actions">
			<p className="block-editor-block-lock-modal__lock-design-help">
				{ __(
					'Lock the design and inner layout. This turns the block into a pattern, so styling stays consistent while the content remains editable.'
				) }
			</p>
			<Button
				className="block-editor-block-lock-modal__lock-design-button"
				variant="secondary"
				icon={ lockIcon }
				onClick={ onClick }
				__next40pxDefaultSize
			>
				{ __( 'Lock design' ) }
			</Button>
		</div>
	);
}

/**
 * Fills the block lock modal with a "Lock design" action that converts the
 * block into an unsynced pattern, which is treated as content-only — design
 * locked, content editable. Reuses the existing create-pattern flow; the only
 * deviation is defaulting to unsynced (the variant that yields content-only
 * editing).
 *
 * @return {React.ComponentType} The fill.
 */
export default function LockDesignButton() {
	// The client id of the block whose design is being locked. Held here, at a
	// persistently-mounted level, so the create-pattern modal survives the lock
	// modal closing.
	const [ patternClientId, setPatternClientId ] = useState( null );
	const { getBlocksByClientId, getBlockAttributes } =
		useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	return (
		<>
			<BlockLockModalActionsSlotFill.Fill>
				{ ( { clientId, onClose } ) => (
					<LockDesignControl
						clientId={ clientId }
						onClick={ () => {
							setPatternClientId( clientId );
							// Close the lock modal so step 2 takes over.
							onClose();
						} }
					/>
				) }
			</BlockLockModalActionsSlotFill.Fill>
			{ patternClientId && (
				<CreatePatternModal
					defaultSyncType={ PATTERN_SYNC_TYPES.unsynced }
					content={ () =>
						serialize( getBlocksByClientId( [ patternClientId ] ) )
					}
					onSuccess={ ( { pattern } ) => {
						const existingAttributes =
							getBlockAttributes( patternClientId );
						updateBlockAttributes( patternClientId, {
							metadata: {
								...( existingAttributes?.metadata ?? {} ),
								patternName: `core/block/${ pattern.id }`,
								name: pattern.title.raw,
							},
						} );
						createSuccessNotice(
							sprintf(
								// translators: %s: the name the user has given to the pattern.
								__( 'Design locked: %s' ),
								pattern.title.raw
							),
							{
								type: 'snackbar',
								id: 'lock-design-success',
							}
						);
						setPatternClientId( null );
					} }
					onError={ () => setPatternClientId( null ) }
					onClose={ () => setPatternClientId( null ) }
				/>
			) }
		</>
	);
}
