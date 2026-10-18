import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	Button,
	CheckboxControl as WCCheckboxControl,
	Flex,
	FlexItem,
	Icon as WCIcon,
	Modal,
	ToggleControl,
} from '@wordpress/components';
import { lock as lockIcon, unlock as unlockIcon } from '@wordpress/icons';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { BlockAttributes } from '../../store/types';
import {
	applyLockSelection,
	getSharedLockValue,
	getTemplateLockValue,
} from './utils';
import type {
	BlockLock,
	BlockLockModalProps,
	BlockLockSelection,
	SharedLockValue,
} from './types';

// Entity based blocks which allow edit locking
const ALLOWS_EDIT_LOCKING = [ 'core/navigation' ];

/**
 * The block editor selectors the modal reads.
 */
interface BlockLockSelectors {
	getBlockName: ( clientId: string ) => string | null;
	getBlockAttributes: ( clientId: string ) => BlockAttributes | null;
	isEditLockedBlock: ( clientId: string ) => boolean;
	isMoveLockedBlock: ( clientId: string ) => boolean;
	isRemoveLockedBlock: ( clientId: string ) => boolean;
}

/**
 * Returns whether a block offers the edit lock feature.
 *
 * @param selectors The block editor selectors.
 * @param clientId  The block client ID.
 *
 * @return Whether the block offers the edit lock feature.
 */
function allowsEditLock( selectors: BlockLockSelectors, clientId: string ) {
	return ALLOWS_EDIT_LOCKING.includes(
		selectors.getBlockName( clientId ) as string
	);
}

/**
 * Returns a block's current lock, including locks inherited from a parent's
 * template lock. A block that doesn't offer the edit feature keeps its saved
 * `edit` value, which is usually unset.
 *
 * @param selectors The block editor selectors.
 * @param clientId  The block client ID.
 *
 * @return The block's current lock.
 */
function getCurrentLock(
	selectors: BlockLockSelectors,
	clientId: string
): BlockLock {
	return {
		move: selectors.isMoveLockedBlock( clientId ),
		remove: selectors.isRemoveLockedBlock( clientId ),
		edit: allowsEditLock( selectors, clientId )
			? selectors.isEditLockedBlock( clientId )
			: selectors.getBlockAttributes( clientId )?.lock?.edit,
	};
}

/**
 * Returns whether a block holds a template lock.
 *
 * @param selectors The block editor selectors.
 * @param clientId  The block client ID.
 *
 * @return Whether the block holds a template lock.
 */
function hasAppliedTemplateLock(
	selectors: BlockLockSelectors,
	clientId: string
) {
	return !! selectors.getBlockAttributes( clientId )?.templateLock;
}

/**
 * Returns whether a block's type supports a template lock.
 *
 * @param selectors The block editor selectors.
 * @param clientId  The block client ID.
 *
 * @return Whether the block's type supports a template lock.
 */
function supportsTemplateLock(
	selectors: BlockLockSelectors,
	clientId: string
) {
	const blockName = selectors.getBlockName( clientId ) as string;
	return !! getBlockType( blockName )?.attributes?.templateLock;
}

/**
 * Returns whether every block passes a check.
 *
 * @param selectors The block editor selectors.
 * @param clientIds The block client IDs.
 * @param predicate The check.
 *
 * @return Whether every block passes the check.
 */
function everyBlock(
	selectors: BlockLockSelectors,
	clientIds: string[],
	predicate: ( selectors: BlockLockSelectors, clientId: string ) => boolean
) {
	return clientIds.every( ( clientId ) => predicate( selectors, clientId ) );
}

/**
 * Returns the lock state shared by the blocks. Every value is a primitive so
 * that `useSelect` only re-renders when one of them changes.
 *
 * @param clientIds The block client IDs.
 *
 * @return The shared lock state.
 */
function useSharedLockState( clientIds: string[] ) {
	return useSelect(
		( select ) => {
			const selectors: BlockLockSelectors = unlock(
				select( blockEditorStore )
			);
			const locks = clientIds.map( ( clientId ) =>
				getCurrentLock( selectors, clientId )
			);

			return {
				isEditLocked: getSharedLockValue(
					locks.map( ( lock ) => !! lock.edit )
				),
				isMoveLocked: getSharedLockValue(
					locks.map( ( lock ) => !! lock.move )
				),
				isRemoveLocked: getSharedLockValue(
					locks.map( ( lock ) => !! lock.remove )
				),
				allowsEditLocking: everyBlock(
					selectors,
					clientIds,
					allowsEditLock
				),
				hasTemplateLock: everyBlock(
					selectors,
					clientIds,
					supportsTemplateLock
				),
				appliesTemplateLock: getSharedLockValue(
					clientIds.map( ( clientId ) =>
						hasAppliedTemplateLock( selectors, clientId )
					)
				),
			};
		},
		[ clientIds ]
	);
}

/**
 * Returns the lock features chosen in the modal, starting from the blocks'
 * shared lock state.
 *
 * @param clientIds The block client IDs.
 *
 * @return The shared lock state and the chosen lock features.
 */
function useLockSelection( clientIds: string[] ) {
	const sharedState = useSharedLockState( clientIds );
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
 * Returns the attributes that apply the chosen lock features to each block.
 *
 * @param selectors         The block editor selectors.
 * @param clientIds         The block client IDs.
 * @param lock              The chosen lock features.
 * @param applyTemplateLock Whether to apply the lock to inner blocks, or
 *                          `null` to keep each block's current choice.
 *
 * @return The attributes of each block, keyed by client ID.
 */
function getLockAttributesByClientId(
	selectors: BlockLockSelectors,
	clientIds: string[],
	lock: BlockLockSelection,
	applyTemplateLock: SharedLockValue
) {
	return Object.fromEntries(
		clientIds.map( ( clientId ) => {
			const newLock = applyLockSelection(
				lock,
				getCurrentLock( selectors, clientId )
			);
			const shouldApplyTemplateLock =
				applyTemplateLock ??
				hasAppliedTemplateLock( selectors, clientId );

			return [
				clientId,
				{
					lock: newLock,
					templateLock: shouldApplyTemplateLock
						? getTemplateLockValue( newLock )
						: undefined,
				},
			];
		} )
	);
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
	const hasMultipleBlocks = clientIds.length > 1;

	const lockValues = Object.values( lock );
	const isAllChecked = lockValues.every( ( value ) => value === true );
	const isMixed =
		! isAllChecked && lockValues.some( ( value ) => value !== false );
	const hasMixedSettings =
		lockValues.includes( null ) ||
		( hasTemplateLock && applyTemplateLock === null );

	const isDirty =
		hasLockChanged( lock, initialLock ) ||
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
					updateBlockAttributes(
						clientIds,
						getLockAttributesByClientId(
							unlock( registry.select( blockEditorStore ) ),
							clientIds,
							lock,
							applyTemplateLock
						),
						{ uniqueByBlock: true }
					);
					onClose();
				} }
			>
				<fieldset className="block-editor-block-lock-modal__options">
					<legend>
						{ hasMultipleBlocks
							? __(
									'Select the features you want to lock. Changes will apply to all selected blocks.'
								)
							: __( 'Select the features you want to lock' ) }
					</legend>
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
						<ToggleControl
							className="block-editor-block-lock-modal__template-lock"
							label={ __( 'Apply to all blocks inside' ) }
							checked={ applyTemplateLock === true }
							disabled={
								lock.move === true && lock.remove === false
							}
							onChange={ () =>
								setApplyTemplateLock( ! applyTemplateLock )
							}
						/>
					) }
					{ hasMultipleBlocks && hasMixedSettings && (
						<p className="block-editor-block-lock-modal__description">
							{ __(
								'Selected blocks have different lock settings. Options in a mixed state keep each block’s current setting.'
							) }
						</p>
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
