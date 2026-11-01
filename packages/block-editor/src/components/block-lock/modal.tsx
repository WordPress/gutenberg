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
import { getSharedLockValue, getTemplateLockValue } from './utils';
import type {
	BlockLock,
	BlockLockModalProps,
	BlockLockSelection,
	SharedLockValue,
} from './types';

// Entity based blocks which allow edit locking
const ALLOWS_EDIT_LOCKING = [ 'core/navigation' ];

/**
 * Returns whether a block type can apply its lock to its inner blocks.
 *
 * @param blockName The block name.
 *
 * @return Whether the block type supports a template lock.
 */
function hasTemplateLockSupport( blockName: string ) {
	return !! getBlockType( blockName )?.attributes?.templateLock;
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
 * Returns the attributes that apply the chosen lock options to a block. Options
 * left mixed keep the block's saved values.
 *
 * @param blockName         The block name.
 * @param attributes        The block's saved attributes.
 * @param chosenLock        The lock options that aren't mixed.
 * @param applyTemplateLock Whether to apply the lock to the inner blocks, or
 *                          `null` when the blocks differ.
 *
 * @return The block's new lock attributes.
 */
function getLockAttributes(
	blockName: string,
	attributes: BlockAttributes | null,
	chosenLock: BlockLock,
	applyTemplateLock: SharedLockValue
) {
	const newLock = { ...attributes?.lock, ...chosenLock };
	// Leaves a block without a lock as it is when every option is mixed.
	const lock = Object.keys( newLock ).length > 0 ? newLock : undefined;
	const keepsTemplateLock =
		applyTemplateLock === null ||
		! hasTemplateLockSupport( blockName ) ||
		// A `contentOnly` lock already applies to the inner blocks, in a way
		// the modal can't express.
		( applyTemplateLock && attributes?.templateLock === 'contentOnly' );

	if ( keepsTemplateLock ) {
		return { lock };
	}

	return {
		lock,
		templateLock: applyTemplateLock
			? getTemplateLockValue( newLock )
			: undefined,
	};
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
				// The modal is opened for existing blocks.
				const blockNames = clientIds.map(
					( clientId ) => getBlockName( clientId ) as string
				);
				const templateLocks = clientIds
					.filter( ( _clientId, index ) =>
						hasTemplateLockSupport( blockNames[ index ] )
					)
					.map(
						( clientId ) =>
							!! getBlockAttributes( clientId )?.templateLock
					);

				return {
					allowsEditLocking: blockNames.every( ( blockName ) =>
						ALLOWS_EDIT_LOCKING.includes( blockName )
					),
					// Offered when at least one block can hold inner blocks,
					// and applied only to those that can.
					hasTemplateLock: templateLocks.length > 0,
					appliesTemplateLock: getSharedLockValue( templateLocks ),
				};
			},
			[ clientIds ]
		);
	const initialLock: BlockLockSelection = {
		move: isMoveLocked,
		remove: isRemoveLocked,
		...( allowsEditLocking ? { edit: isEditLocked } : {} ),
	};
	const [ lock, setLock ] = useState( initialLock );
	const [ applyTemplateLock, setApplyTemplateLock ] =
		useState( appliesTemplateLock );
	// A template lock can't prevent moving inner blocks while allowing their
	// removal, so it isn't offered when any block would end up with that lock.
	const isTemplateLockDisabled = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const chosenLock = getChosenLock( lock );

			return clientIds.some( ( clientId ) => {
				if (
					! hasTemplateLockSupport(
						getBlockName( clientId ) as string
					)
				) {
					return false;
				}
				const newLock = {
					...getBlockAttributes( clientId )?.lock,
					...chosenLock,
				};
				return !! newLock.move && ! newLock.remove;
			} );
		},
		[ clientIds, lock ]
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
		! isShallowEqual( lock, initialLock ) ||
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
					const { getBlockName, getBlockAttributes } =
						registry.select( blockEditorStore );
					const chosenLock = getChosenLock( lock );
					updateBlockAttributes(
						clientIds,
						Object.fromEntries(
							clientIds.map( ( clientId ) => [
								clientId,
								getLockAttributes(
									getBlockName( clientId ) as string,
									getBlockAttributes( clientId ),
									chosenLock,
									applyTemplateLock
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
							disabled={ isTemplateLockDisabled }
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
