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
	Icon as WCIcon,
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
import { unlock } from '../../lock-unlock';

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
	const {
		allowsEditLocking,
		hasLayoutLock,
		isPatternSection,
		metadata,
		templateLock,
		hasTemplateLock,
	} = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const { getBlockName, getBlockAttributes } = blockEditorSelect;
			const { isSectionBlock } = unlock( blockEditorSelect );
			const blockName = getBlockName( clientId );
			const blockType = getBlockType( blockName );
			const attributes = getBlockAttributes( clientId );
			const _isPatternSection =
				!! attributes?.metadata?.patternName &&
				isSectionBlock( clientId );
			const _hasTemplateLock = !! blockType?.attributes?.templateLock;

			return {
				allowsEditLocking: ALLOWS_EDIT_LOCKING.includes( blockName ),
				hasLayoutLock: _hasTemplateLock || _isPatternSection,
				isPatternSection: _isPatternSection,
				metadata: attributes?.metadata,
				templateLock: attributes?.templateLock,
				hasTemplateLock: _hasTemplateLock,
			};
		},
		[ clientId ]
	);
	const hasAppliedTemplateLock =
		!! templateLock && templateLock !== 'contentOnly';
	const isLayoutLocked = templateLock === 'contentOnly' || isPatternSection;
	const [ applyTemplateLock, setApplyTemplateLock ] = useState(
		hasAppliedTemplateLock
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientId );

	useEffect( () => {
		setLock( {
			move: isMoveLocked,
			remove: isRemoveLocked,
			...( allowsEditLocking ? { edit: isEditLocked } : {} ),
			...( hasLayoutLock ? { layout: isLayoutLocked } : {} ),
		} );
	}, [
		isEditLocked,
		isLayoutLocked,
		isMoveLocked,
		isRemoveLocked,
		allowsEditLocking,
		hasLayoutLock,
	] );

	const isLayoutChecked = lock.layout ?? isLayoutLocked;
	const lockValues = [
		lock.move,
		lock.remove,
		...( allowsEditLocking ? [ !! lock.edit ] : [] ),
		...( hasLayoutLock ? [ isLayoutChecked ] : [] ),
	];
	const isAllChecked = lockValues.every( Boolean );
	const isMixed = lockValues.some( Boolean ) && ! isAllChecked;

	const isDirty =
		lock.move !== isMoveLocked ||
		lock.remove !== isRemoveLocked ||
		( allowsEditLocking && lock.edit !== isEditLocked ) ||
		( hasLayoutLock && isLayoutChecked !== isLayoutLocked ) ||
		( hasTemplateLock &&
			! isLayoutChecked &&
			applyTemplateLock !== hasAppliedTemplateLock );
	const isTemplateLockToggleChecked = ! isLayoutChecked && applyTemplateLock;

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
					const blockLock = { ...lock };
					delete blockLock.layout;
					const blockAttributes = {
						lock: blockLock,
					};
					let templateLockValue;
					if ( isLayoutChecked ) {
						templateLockValue = 'contentOnly';
					} else if ( applyTemplateLock ) {
						templateLockValue = getTemplateLockValue( blockLock );
					}
					if ( isPatternSection && ! isLayoutChecked ) {
						blockAttributes.metadata = {
							...metadata,
							patternName: undefined,
						};
					}
					updateBlockAttributes( [ clientId ], {
						...blockAttributes,
						templateLock: templateLockValue,
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
										...( hasLayoutLock
											? { layout: newValue }
											: {} ),
									} );
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
									<WCIcon
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
									<WCIcon
										className="block-editor-block-lock-modal__lock-icon"
										icon={
											lock.remove ? lockIcon : unlockIcon
										}
									/>
								</li>
								{ hasLayoutLock && (
									<li className="block-editor-block-lock-modal__checklist-item">
										<CheckboxControl
											label={ __( 'Lock layout' ) }
											checked={ isLayoutChecked }
											onChange={ ( layout ) => {
												setLock( ( prevLock ) => ( {
													...prevLock,
													layout,
												} ) );
											} }
										/>
										<WCIcon
											className="block-editor-block-lock-modal__lock-icon"
											icon={
												isLayoutChecked
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
							checked={ isTemplateLockToggleChecked }
							disabled={
								isLayoutChecked ||
								( lock.move && ! lock.remove )
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
