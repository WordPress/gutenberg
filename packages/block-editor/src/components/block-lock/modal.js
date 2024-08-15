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
const ALLOWS_EDIT_LOCKING = [ 'core/block', 'core/navigation' ];

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
	const { canEdit, canMove, canRemove } = useBlockLock( clientId );
	const { allowsEditLocking, templateLock, hasTemplateLock } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const blockName = getBlockName( clientId );
			const blockType = getBlockType( blockName );

			return {
				allowsEditLocking: ALLOWS_EDIT_LOCKING.includes( blockName ),
				templateLock: getBlockAttributes( clientId )?.templateLock,
				hasTemplateLock: !! blockType?.attributes?.templateLock,
			};
		},
		[ clientId ]
	);
	const [ applyTemplateLock, setApplyTemplateLock ] = useState(
		!! templateLock
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientId );

	useEffect( () => {
		setLock( {
			move: ! canMove,
			remove: ! canRemove,
			...( allowsEditLocking ? { edit: ! canEdit } : {} ),
		} );
	}, [ canEdit, canMove, canRemove, allowsEditLocking ] );

	const isAllChecked = Object.values( lock ).every( Boolean );
	const isMixed = Object.values( lock ).some( Boolean ) && ! isAllChecked;

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: Name of the block. */
				__( 'Lock %s' ),
				blockInformation.title
			) }
			overlayClassName="block-editor-block-lock-modal"
			onRequestClose={ onClose }
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					updateBlockAttributes( [ clientId ], {
						lock,
						templateLock: applyTemplateLock
							? getTemplateLockValue( lock )
							: undefined,
					} );
					onClose();
				} }
			>
				<fieldset className="block-editor-block-lock-modal__options">
					<legend>
						{ __(
							'Choose specific attributes to restrict or lock all available options.'
						) }
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
								__nextHasNoMarginBottom
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
										<CheckboxControl
											__nextHasNoMarginBottom
											label={ __( 'Restrict editing' ) }
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
										__nextHasNoMarginBottom
										label={ __( 'Disable movement' ) }
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
										__nextHasNoMarginBottom
										label={ __( 'Prevent removal' ) }
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
							</ul>
						</li>
					</ul>
					{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
					{ hasTemplateLock && (
						<ToggleControl
							__nextHasNoMarginBottom
							className="block-editor-block-lock-modal__template-lock"
							label={ __( 'Apply to all blocks inside' ) }
							checked={ applyTemplateLock }
							disabled={ lock.move && ! lock.remove }
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
