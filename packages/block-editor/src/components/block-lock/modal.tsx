import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	CheckboxControl as WCCheckboxControl,
	Flex,
	FlexItem,
	Icon as WCIcon,
	Modal,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { lock as lockIcon, unlock as unlockIcon } from '@wordpress/icons';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import { getBlockType } from '@wordpress/blocks';
import useBlockLock from './use-block-lock';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import type { BlockAttributes } from '../../store/types';
import { getNewLock, getSharedLockValue, getTemplateLockValue } from './utils';
import type {
	BlockLock,
	BlockLockModalProps,
	BlockLockSelection,
	SharedLockValue,
} from './types';

// Entity based blocks which allow edit locking
const ALLOWS_EDIT_LOCKING = [ 'core/navigation' ];

/**
 * The block editor store selectors the modal reads blocks with.
 */
interface BlockSelectors {
	getBlockName: ( clientId: string ) => string | null;
	getBlockAttributes: ( clientId: string ) => BlockAttributes | null;
}

/**
 * Returns whether a block type allows locking its editing.
 *
 * @param blockName The block name, or `null` when the block doesn't exist.
 *
 * @return Whether the block type supports an edit lock.
 */
function hasEditLockSupport( blockName: string | null ) {
	return !! blockName && ALLOWS_EDIT_LOCKING.includes( blockName );
}

/**
 * Returns whether a block type can apply its lock to its inner blocks.
 *
 * @param blockName The block name, or `null` when the block doesn't exist.
 *
 * @return Whether the block type supports a template lock.
 */
function hasTemplateLockSupport( blockName: string | null ) {
	return (
		!! blockName && !! getBlockType( blockName )?.attributes?.templateLock
	);
}

/**
 * Returns the lock options that aren't mixed.
 *
 * @param lock The lock options chosen in the modal.
 *
 * @return The chosen lock options.
 */
function getChosenLock( lock: BlockLockSelection ): BlockLock {
	return Object.fromEntries(
		Object.entries( lock ).filter( ( [ , value ] ) => value !== null )
	);
}

/**
 * Returns whether applying the lock to the inner blocks keeps a block's saved
 * template lock as it is.
 *
 * @param attributes The block's saved attributes.
 * @param lock       The block's new lock.
 *
 * @return Whether the saved template lock already applies the lock.
 */
function keepsAppliedTemplateLock(
	attributes: BlockAttributes | null,
	lock: BlockLock | undefined
) {
	if ( ! attributes?.templateLock ) {
		return false;
	}

	// A `contentOnly` lock already applies to the inner blocks, in a way the
	// modal can't express. Any other template lock stays when the block's own
	// lock is left as it is, since its options were left mixed. `getNewLock`
	// returns the saved lock itself in that case.
	return (
		attributes.templateLock === 'contentOnly' || lock === attributes.lock
	);
}

/**
 * Returns whether a block keeps its saved template lock.
 *
 * @param blockName         The block name.
 * @param attributes        The block's saved attributes.
 * @param lock              The block's new lock.
 * @param applyTemplateLock Whether to apply the lock to the inner blocks, or
 *                          `null` to keep each block's saved template lock.
 *
 * @return Whether the block's template lock stays as it is.
 */
function keepsTemplateLock(
	blockName: string,
	attributes: BlockAttributes | null,
	lock: BlockLock | undefined,
	applyTemplateLock: SharedLockValue
) {
	if ( applyTemplateLock === null || ! hasTemplateLockSupport( blockName ) ) {
		return true;
	}

	return applyTemplateLock && keepsAppliedTemplateLock( attributes, lock );
}

/**
 * Returns the attributes that apply the chosen lock options to a block. Options
 * left mixed keep the block's saved values.
 *
 * @param blockName         The block name.
 * @param attributes        The block's saved attributes.
 * @param chosenLock        The lock options that aren't mixed.
 * @param applyTemplateLock Whether to apply the lock to the inner blocks, or
 *                          `null` to keep each block's saved template lock.
 *
 * @return The block's new lock attributes.
 */
function getLockAttributes(
	blockName: string,
	attributes: BlockAttributes | null,
	chosenLock: BlockLock,
	applyTemplateLock: SharedLockValue
) {
	const lock = getNewLock( attributes?.lock, chosenLock );

	if ( keepsTemplateLock( blockName, attributes, lock, applyTemplateLock ) ) {
		return { lock };
	}

	return {
		lock,
		templateLock: applyTemplateLock
			? getTemplateLockValue( lock ?? {} )
			: undefined,
	};
}

/**
 * Returns the new lock attributes of each block that still exists, keyed by
 * client ID.
 *
 * @param select            The block editor store selectors.
 * @param clientIds         The client IDs of the blocks.
 * @param chosenLock        The lock options that aren't mixed.
 * @param applyTemplateLock Whether to apply the lock to the inner blocks, or
 *                          `null` to keep each block's saved template lock.
 *
 * @return The lock attributes of each block.
 */
function getLockUpdates(
	select: BlockSelectors,
	clientIds: string[],
	chosenLock: BlockLock,
	applyTemplateLock: SharedLockValue
) {
	return Object.fromEntries(
		clientIds.flatMap( ( clientId ) => {
			const blockName = select.getBlockName( clientId );
			if ( ! blockName ) {
				return [];
			}
			return [
				[
					clientId,
					getLockAttributes(
						blockName,
						select.getBlockAttributes( clientId ),
						chosenLock,
						applyTemplateLock
					),
				],
			];
		} )
	);
}

export default function BlockLockModal( {
	clientIds,
	onClose,
}: BlockLockModalProps ) {
	const { isEditLocked, isMoveLocked, isRemoveLocked } =
		useBlockLock( clientIds );
	const { allowsEditLocking, hasTemplateLock, appliesTemplateLock } =
		useSelect(
			( select ) => {
				const { getBlockName, getBlockAttributes } =
					select( blockEditorStore );
				const templateLocks = clientIds
					.filter( ( clientId ) =>
						hasTemplateLockSupport( getBlockName( clientId ) )
					)
					.map(
						( clientId ) =>
							!! getBlockAttributes( clientId )?.templateLock
					);

				return {
					allowsEditLocking: clientIds.every( ( clientId ) =>
						hasEditLockSupport( getBlockName( clientId ) )
					),
					// Offered when at least one block can hold inner blocks,
					// and applied only to those that can.
					hasTemplateLock: templateLocks.length > 0,
					appliesTemplateLock: getSharedLockValue( templateLocks ),
				};
			},
			[ clientIds ]
		);
	const currentLock: BlockLockSelection = {
		move: isMoveLocked,
		remove: isRemoveLocked,
		...( allowsEditLocking ? { edit: isEditLocked } : {} ),
	};
	// Only the options the user changes are kept, so the others follow the
	// blocks' current values when they change while the modal is open, e.g.
	// through undo or another user in a collaborative session.
	const [ lockEdits, setLockEdits ] = useState<
		Partial< BlockLockSelection >
	>( {} );
	const [ templateLockEdit, setTemplateLockEdit ] = useState< boolean >();
	const lock = { ...currentLock, ...lockEdits };
	const applyTemplateLock = templateLockEdit ?? appliesTemplateLock;
	// A template lock can't prevent moving inner blocks while allowing their
	// removal, so it isn't offered when any block would end up with that lock.
	const { move: lockMove, remove: lockRemove } = lock;
	const isTemplateLockDisabled = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const chosenLock = getChosenLock( {
				move: lockMove,
				remove: lockRemove,
			} );

			return clientIds.some( ( clientId ) => {
				if ( ! hasTemplateLockSupport( getBlockName( clientId ) ) ) {
					return false;
				}
				const newLock = getNewLock(
					getBlockAttributes( clientId )?.lock,
					chosenLock
				);
				return !! newLock?.move && ! newLock.remove;
			} );
		},
		[ clientIds, lockMove, lockRemove ]
	);
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientIds[ 0 ] );
	const descriptionId = useInstanceId(
		BlockLockModal,
		'block-editor-block-lock-modal__description'
	);
	const hasMultipleBlocks = clientIds.length > 1;

	const lockValues = Object.values( lock );
	const isAllChecked = lockValues.every( ( value ) => value === true );
	const isMixed =
		! isAllChecked && lockValues.some( ( value ) => value !== false );
	const hasMixedSettings =
		lockValues.includes( null ) ||
		( hasTemplateLock && applyTemplateLock === null );
	const showDescription = hasMultipleBlocks && hasMixedSettings;

	const isDirty =
		! isShallowEqual( lock, currentLock ) ||
		( hasTemplateLock && applyTemplateLock !== appliesTemplateLock );

	const title = hasMultipleBlocks
		? __( 'Lock blocks' )
		: sprintf(
				/* translators: %s: Name of the block. */
				__( 'Lock %s' ),
				// An existing block has display information.
				blockInformation!.title
			);

	return (
		<Modal
			title={ title }
			overlayClassName="block-editor-block-lock-modal"
			onRequestClose={ onClose }
			size="small"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					if ( ! isDirty ) {
						return;
					}
					// A disabled "Apply to all blocks inside" keeps each
					// block's saved template lock, like a mixed one does.
					const lockUpdates = getLockUpdates(
						registry.select( blockEditorStore ),
						clientIds,
						getChosenLock( lock ),
						isTemplateLockDisabled ? null : applyTemplateLock
					);
					updateBlockAttributes(
						Object.keys( lockUpdates ),
						lockUpdates,
						{ uniqueByBlock: true }
					);
					onClose();
				} }
			>
				<fieldset
					className="block-editor-block-lock-modal__options"
					aria-describedby={
						showDescription ? descriptionId : undefined
					}
				>
					<legend>
						{ __( 'Select the features you want to lock' ) }
					</legend>
					{ showDescription && (
						<p
							id={ descriptionId }
							className="block-editor-block-lock-modal__description"
						>
							{ __(
								'Selected blocks have different lock settings. Options in a mixed state keep each block’s current setting.'
							) }
						</p>
					) }
					{ /*
					 * Disable reason: The `list` ARIA role is redundant but
					 * Safari+VoiceOver won't announce the list otherwise.
					 */
					/* eslint-disable jsx-a11y/no-redundant-roles */ }
					<ul
						role="list"
						className="block-editor-block-lock-modal__checklist"
					>
						<li>
							<WCCheckboxControl
								className="block-editor-block-lock-modal__options-all"
								label={ __( 'Lock all' ) }
								checked={ isAllChecked }
								indeterminate={ isMixed }
								onChange={ ( newValue ) =>
									setLockEdits( {
										move: newValue,
										remove: newValue,
										...( allowsEditLocking
											? { edit: newValue }
											: {} ),
									} )
								}
							/>
							<ul
								role="list"
								className="block-editor-block-lock-modal__checklist"
							>
								{ allowsEditLocking && (
									<li className="block-editor-block-lock-modal__checklist-item">
										<WCCheckboxControl
											label={ __( 'Lock editing' ) }
											checked={ lock.edit === true }
											indeterminate={ lock.edit === null }
											onChange={ ( edit ) =>
												setLockEdits(
													( prevEdits ) => ( {
														...prevEdits,
														edit,
													} )
												)
											}
										/>
										<WCIcon
											className="block-editor-block-lock-modal__lock-icon"
											icon={
												lock.edit
													? lockIcon
													: unlockIcon
											}
										/>
									</li>
								) }
								<li className="block-editor-block-lock-modal__checklist-item">
									<WCCheckboxControl
										label={ __( 'Lock movement' ) }
										checked={ lock.move === true }
										indeterminate={ lock.move === null }
										onChange={ ( move ) =>
											setLockEdits( ( prevEdits ) => ( {
												...prevEdits,
												move,
											} ) )
										}
									/>
									<WCIcon
										className="block-editor-block-lock-modal__lock-icon"
										icon={
											lock.move ? lockIcon : unlockIcon
										}
									/>
								</li>
								<li className="block-editor-block-lock-modal__checklist-item">
									<WCCheckboxControl
										label={ __( 'Lock removal' ) }
										checked={ lock.remove === true }
										indeterminate={ lock.remove === null }
										onChange={ ( remove ) =>
											setLockEdits( ( prevEdits ) => ( {
												...prevEdits,
												remove,
											} ) )
										}
									/>
									<WCIcon
										className="block-editor-block-lock-modal__lock-icon"
										icon={
											lock.remove ? lockIcon : unlockIcon
										}
									/>
								</li>
							</ul>
						</li>
					</ul>
					{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
					{ hasTemplateLock && (
						<WCCheckboxControl
							className="block-editor-block-lock-modal__template-lock"
							label={ __( 'Apply to all blocks inside' ) }
							checked={ applyTemplateLock === true }
							indeterminate={ applyTemplateLock === null }
							disabled={ isTemplateLockDisabled }
							onChange={ setTemplateLockEdit }
						/>
					) }
				</fieldset>
				<Flex
					className="block-editor-block-lock-modal__actions"
					justify="flex-end"
					expanded={ false }
				>
					<FlexItem>
						<Button
							variant="tertiary"
							onClick={ onClose }
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! isDirty }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Apply' ) }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}
