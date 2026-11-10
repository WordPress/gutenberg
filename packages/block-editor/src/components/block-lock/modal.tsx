import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import {
	CheckboxControl,
	CheckboxGroup,
	Fieldset,
	Icon,
	Stack,
	SwitchControl,
} from '@wordpress/ui';
import { lock as lockIcon, unlock as unlockIcon } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import useBlockLock from './use-block-lock';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import type { BlockLock, BlockLockModalProps } from './types';

// Entity based blocks which allow edit locking
const ALLOWS_EDIT_LOCKING = [ 'core/navigation' ];

function getTemplateLockValue( lock: BlockLock ) {
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

export default function BlockLockModal( {
	clientId,
	onClose,
}: BlockLockModalProps ) {
	const { isEditLocked, isMoveLocked, isRemoveLocked } =
		useBlockLock( clientId );
	const { allowsEditLocking, templateLock, hasTemplateLock } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			// The modal is opened for an existing block.
			const blockName = getBlockName( clientId ) as string;
			const blockType = getBlockType( blockName );

			return {
				allowsEditLocking: ALLOWS_EDIT_LOCKING.includes( blockName ),
				templateLock: getBlockAttributes( clientId )?.templateLock,
				hasTemplateLock: !! blockType?.attributes?.templateLock,
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientId );
	const [ lockedFeatures, setLockedFeatures ] = useState< string[] >( () =>
		[
			allowsEditLocking && isEditLocked && 'edit',
			isMoveLocked && 'move',
			isRemoveLocked && 'remove',
		].filter( ( feature ): feature is string => !! feature )
	);
	const [ applyTemplateLock, setApplyTemplateLock ] =
		useState( !! templateLock );

	const lock: BlockLock = {
		move: lockedFeatures.includes( 'move' ),
		remove: lockedFeatures.includes( 'remove' ),
		...( allowsEditLocking
			? { edit: lockedFeatures.includes( 'edit' ) }
			: {} ),
	};

	const options = [
		...( allowsEditLocking
			? [ { value: 'edit', label: __( 'Lock editing' ) } ]
			: [] ),
		{ value: 'move', label: __( 'Lock movement' ) },
		{ value: 'remove', label: __( 'Lock removal' ) },
	];

	const isDirty =
		lock.move !== isMoveLocked ||
		lock.remove !== isRemoveLocked ||
		( allowsEditLocking && lock.edit !== isEditLocked ) ||
		( hasTemplateLock && applyTemplateLock !== !! templateLock );

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: Name of the block. */
				__( 'Lock %s' ),
				// An existing block has display information.
				blockInformation!.title
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
					updateBlockAttributes( [ clientId ], {
						lock,
						templateLock: applyTemplateLock
							? getTemplateLockValue( lock )
							: undefined,
					} );
					onClose();
				} }
			>
				<Stack direction="column" gap="xl">
					<Fieldset.Root
						render={
							<CheckboxGroup
								value={ lockedFeatures }
								onValueChange={ setLockedFeatures }
								allValues={ options.map(
									( option ) => option.value
								) }
							/>
						}
					>
						<Fieldset.Legend>
							{ __( 'Select the features you want to lock' ) }
						</Fieldset.Legend>
						<CheckboxControl
							parent
							value="all"
							label={ __( 'Lock all' ) }
						/>
						<CheckboxGroup.NestedItems>
							{ options.map( ( { value, label } ) => (
								<Stack
									key={ value }
									justify="space-between"
									align="center"
									gap="md"
								>
									<CheckboxControl
										value={ value }
										label={ label }
									/>
									<Icon
										icon={
											lockedFeatures.includes( value )
												? lockIcon
												: unlockIcon
										}
									/>
								</Stack>
							) ) }
						</CheckboxGroup.NestedItems>
					</Fieldset.Root>
					{ hasTemplateLock && (
						<SwitchControl
							className="block-editor-block-lock-modal__template-lock"
							label={ __( 'Apply to all blocks inside' ) }
							checked={ applyTemplateLock }
							disabled={ lock.move && ! lock.remove }
							onCheckedChange={ setApplyTemplateLock }
						/>
					) }
					<Stack justify="flex-end" gap="sm">
						<Button
							variant="tertiary"
							onClick={ onClose }
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							disabled={ ! isDirty }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Apply' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}
