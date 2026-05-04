/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	Button,
	CheckboxControl,
	Flex,
	FlexItem,
	Icon,
	Modal,
	ToggleControl,
} from '@wordpress/components';
import { lock as lockIcon, unlock as unlockIcon } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useBlockLock from './use-block-lock';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';

// Entity based blocks which allow edit locking
const ALLOWS_EDIT_LOCKING = [ 'core/navigation' ];

function getTemplateLockValue( lock ) {
	// Prevents all operations.
	if ( lock.remove && lock.move ) {
		return 'all';
	}

	// Prevents inserting or removing blocks, but allows moving existing blocks.
	if ( lock.remove && ! lock.move ) {
		return 'insert';
	}

	return false;
}

export default function BlockLockModal( { clientId, onClose } ) {
	const [ lock, setLock ] = useState( { move: false, remove: false } );
	const { isEditLocked, isMoveLocked, isRemoveLocked } =
		useBlockLock( clientId );
	const { allowsEditLocking, templateLock, hasTemplateLock, metadata } =
		useSelect(
			( select ) => {
				const { getBlockName, getBlockAttributes } =
					select( blockEditorStore );
				const blockName = getBlockName( clientId );
				const blockType = getBlockType( blockName );
				const attributes = getBlockAttributes( clientId );

				return {
					allowsEditLocking:
						ALLOWS_EDIT_LOCKING.includes( blockName ),
					templateLock: attributes?.templateLock,
					hasTemplateLock: !! blockType?.attributes?.templateLock,
					metadata: attributes?.metadata,
				};
			},
			[ clientId ]
		);
	const [ applyTemplateLock, setApplyTemplateLock ] = useState(
		!! templateLock && templateLock !== 'contentOnly'
	);
	const [ lockLayout, setLockLayout ] = useState(
		templateLock === 'contentOnly'
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientId );

	useEffect( () => {
		setLock( {
			move: isMoveLocked,
			remove: isRemoveLocked,
			...( allowsEditLocking ? { edit: isEditLocked } : {} ),
		} );
	}, [ isEditLocked, isMoveLocked, isRemoveLocked, allowsEditLocking ] );

	const allValues = [
		...Object.values( lock ),
		...( hasTemplateLock ? [ lockLayout ] : [] ),
	];
	const isAllChecked = allValues.every( Boolean );
	const isMixed = allValues.some( Boolean ) && ! isAllChecked;

	const isDirty =
		lock.move !== isMoveLocked ||
		lock.remove !== isRemoveLocked ||
		( allowsEditLocking && lock.edit !== isEditLocked ) ||
		( hasTemplateLock &&
			applyTemplateLock !==
				( !! templateLock && templateLock !== 'contentOnly' ) ) ||
		( hasTemplateLock &&
			lockLayout !== ( templateLock === 'contentOnly' ) );

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: Name of the block. */
				__( 'Lock %s' ),
				blockInformation.title
			) }
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
					let nextTemplateLock;
					if ( lockLayout ) {
						// Layout lock takes precedence — it preserves
						// content editing while freezing structure.
						nextTemplateLock = 'contentOnly';
					} else if ( applyTemplateLock ) {
						nextTemplateLock = getTemplateLockValue( lock );
					} else {
						nextTemplateLock = undefined;
					}
					// Removing layout lock from a block that was identified
					// as a pattern also detaches the pattern identity, since
					// keeping `metadata.patternName` without the structural
					// lock leaves the wrapper in a confusing half-detached
					// state.
					const wasLayoutLocked = templateLock === 'contentOnly';
					const isDetachingPattern =
						wasLayoutLocked &&
						! lockLayout &&
						!! metadata?.patternName;
					let nextMetadata;
					if ( isDetachingPattern ) {
						const { patternName: _, ...rest } = metadata;
						nextMetadata = rest;
					}
					updateBlockAttributes( [ clientId ], {
						lock,
						templateLock: nextTemplateLock,
						...( nextMetadata !== undefined && {
							metadata: nextMetadata,
						} ),
					} );
					onClose();
				} }
			>
				<fieldset className="block-editor-block-lock-modal__options">
					<legend>
						{ __( 'Select the features you want to lock' ) }
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
							<CheckboxControl
								className="block-editor-block-lock-modal__options-all"
								label={ __( 'Lock all' ) }
								checked={ isAllChecked }
								indeterminate={ isMixed }
								onChange={ ( newValue ) => {
									setLock( {
										move: newValue,
										remove: newValue,
										...( allowsEditLocking
											? { edit: newValue }
											: {} ),
									} );
									if ( hasTemplateLock ) {
										setLockLayout( newValue );
									}
								} }
							/>
							<ul
								role="list"
								className="block-editor-block-lock-modal__checklist"
							>
								{ allowsEditLocking && (
									<li className="block-editor-block-lock-modal__checklist-item">
										<CheckboxControl
											label={ __( 'Lock editing' ) }
											checked={ !! lock.edit }
											onChange={ ( edit ) =>
												setLock( ( prevLock ) => ( {
													...prevLock,
													edit,
												} ) )
											}
										/>
										<Icon
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
									<CheckboxControl
										label={ __( 'Lock movement' ) }
										checked={ lock.move }
										onChange={ ( move ) =>
											setLock( ( prevLock ) => ( {
												...prevLock,
												move,
											} ) )
										}
									/>
									<Icon
										className="block-editor-block-lock-modal__lock-icon"
										icon={
											lock.move ? lockIcon : unlockIcon
										}
									/>
								</li>
								<li className="block-editor-block-lock-modal__checklist-item">
									<CheckboxControl
										label={ __( 'Lock removal' ) }
										checked={ lock.remove }
										onChange={ ( remove ) =>
											setLock( ( prevLock ) => ( {
												...prevLock,
												remove,
											} ) )
										}
									/>
									<Icon
										className="block-editor-block-lock-modal__lock-icon"
										icon={
											lock.remove ? lockIcon : unlockIcon
										}
									/>
								</li>
								{ hasTemplateLock && (
									<li className="block-editor-block-lock-modal__checklist-item">
										<CheckboxControl
											label={ __( 'Lock layout' ) }
											checked={ lockLayout }
											onChange={ () =>
												setLockLayout( ! lockLayout )
											}
										/>
										<Icon
											className="block-editor-block-lock-modal__lock-icon"
											icon={
												lockLayout
													? lockIcon
													: unlockIcon
											}
										/>
									</li>
								) }
							</ul>
						</li>
					</ul>
					{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
					{ hasTemplateLock && (
						<ToggleControl
							className="block-editor-block-lock-modal__template-lock"
							label={ __( 'Apply to all blocks inside' ) }
							checked={ applyTemplateLock }
							disabled={
								lockLayout || ( lock.move && ! lock.remove )
							}
							onChange={ () =>
								setApplyTemplateLock( ! applyTemplateLock )
							}
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
