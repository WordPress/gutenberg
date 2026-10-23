import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
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
import type { SelectFunction } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getLockAttributes, getSharedLockValue } from './utils';
import type {
	BlockLock,
	BlockLockModalProps,
	BlockLockSelection,
	BlockLockState,
	SharedLockValue,
	TemplateLock,
} from './types';

// Entity based blocks which allow edit locking
const ALLOWS_EDIT_LOCKING = [ 'core/navigation' ];

/**
 * Returns the saved lock attributes of each block.
 *
 * @param select    The data registry's `select` function.
 * @param clientIds The block client IDs.
 *
 * @return The saved lock attributes of each block.
 */
function getBlockLockStates(
	select: SelectFunction,
	clientIds: string[]
): BlockLockState[] {
	const { getBlockName, getBlockAttributes } = select( blockEditorStore );

	return clientIds.map( ( clientId ) => {
		const attributes = getBlockAttributes( clientId );
		// The modal is opened for existing blocks.
		const blockType = getBlockType( getBlockName( clientId ) as string );

		return {
			lock: attributes?.lock,
			templateLock: attributes?.templateLock as TemplateLock | undefined,
			supportsTemplateLock: !! blockType?.attributes?.templateLock,
		};
	} );
}

/**
 * Returns the lock features chosen in the modal, starting from the blocks'
 * shared lock state, including locks inherited from a parent's template lock.
 *
 * @param clientIds The block client IDs.
 *
 * @return The shared lock state and the chosen lock features.
 */
function useLockSelection( clientIds: string[] ) {
	// Every value is a primitive so that `useSelect` only re-renders when one
	// of them changes.
	const sharedState = useSelect(
		( select ) => {
			const {
				getBlockName,
				isEditLockedBlock,
				isMoveLockedBlock,
				isRemoveLockedBlock,
			} = unlock( select( blockEditorStore ) );
			const templateLockBlocks = getBlockLockStates(
				select,
				clientIds
			).filter( ( block ) => block.supportsTemplateLock );

			return {
				isEditLocked: getSharedLockValue(
					clientIds.map( ( clientId ) =>
						isEditLockedBlock( clientId )
					)
				),
				isMoveLocked: getSharedLockValue(
					clientIds.map( ( clientId ) =>
						isMoveLockedBlock( clientId )
					)
				),
				isRemoveLocked: getSharedLockValue(
					clientIds.map( ( clientId ) =>
						isRemoveLockedBlock( clientId )
					)
				),
				allowsEditLocking: clientIds.every( ( clientId ) =>
					ALLOWS_EDIT_LOCKING.includes( getBlockName( clientId ) )
				),
				// Offered when at least one block can hold inner blocks, and
				// applied only to those that can.
				hasTemplateLock: templateLockBlocks.length > 0,
				appliesTemplateLock: getSharedLockValue(
					templateLockBlocks.map( ( block ) => !! block.templateLock )
				),
			};
		},
		[ clientIds ]
	);
	const { isEditLocked, isMoveLocked, isRemoveLocked, allowsEditLocking } =
		sharedState;
	const initialLock = useMemo< BlockLockSelection >(
		() => ( {
			move: isMoveLocked,
			remove: isRemoveLocked,
			...( allowsEditLocking ? { edit: isEditLocked } : {} ),
		} ),
		[ isEditLocked, isMoveLocked, isRemoveLocked, allowsEditLocking ]
	);
	const [ lock, setLock ] = useState< BlockLockSelection >( initialLock );

	useEffect( () => {
		setLock( initialLock );
	}, [ initialLock ] );

	return { ...sharedState, initialLock, lock, setLock };
}

/**
 * Returns whether any chosen lock feature differs from the initial one.
 *
 * @param lock        The chosen lock features.
 * @param initialLock The initial lock features.
 *
 * @return Whether the lock features changed.
 */
function hasLockChanged(
	lock: BlockLockSelection,
	initialLock: BlockLockSelection
) {
	return ( Object.keys( initialLock ) as Array< keyof BlockLock > ).some(
		( feature ) => lock[ feature ] !== initialLock[ feature ]
	);
}

export default function BlockLockModal( {
	clientIds,
	onClose,
}: BlockLockModalProps ) {
	const {
		allowsEditLocking,
		hasTemplateLock,
		appliesTemplateLock,
		initialLock,
		lock,
		setLock,
	} = useLockSelection( clientIds );
	const [ applyTemplateLock, setApplyTemplateLock ] =
		useState< SharedLockValue >( appliesTemplateLock );
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

	const hasTemplateLockChanged =
		hasTemplateLock && applyTemplateLock !== appliesTemplateLock;
	const isDirty =
		hasLockChanged( lock, initialLock ) || hasTemplateLockChanged;

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
					const blocks = getBlockLockStates(
						registry.select,
						clientIds
					);
					updateBlockAttributes(
						clientIds,
						Object.fromEntries(
							clientIds.map( ( clientId, index ) => [
								clientId,
								getLockAttributes(
									blocks[ index ],
									lock,
									// An untouched choice keeps each block's
									// current one.
									hasTemplateLockChanged
										? applyTemplateLock
										: null
								),
							] )
						),
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
									setLock( {
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
												setLock( ( prevLock ) => ( {
													...prevLock,
													edit,
												} ) )
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
											setLock( ( prevLock ) => ( {
												...prevLock,
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
											setLock( ( prevLock ) => ( {
												...prevLock,
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
							disabled={
								lock.move === true && lock.remove === false
							}
							onChange={ setApplyTemplateLock }
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
