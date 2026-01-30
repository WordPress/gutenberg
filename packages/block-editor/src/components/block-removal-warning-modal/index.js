/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Modal,
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export function BlockRemovalWarningModal( { rules } ) {
	const [ confirmed, setConfirmed ] = useState( false );
	const { clientIds, selectPrevious, message } = useSelect( ( select ) =>
		unlock( select( blockEditorStore ) ).getRemovalPromptData()
	);

	const {
		clearBlockRemovalPrompt,
		setBlockRemovalRules,
		privateRemoveBlocks,
	} = unlock( useDispatch( blockEditorStore ) );

	// Load block removal rules, simultaneously signalling that the block
	// removal prompt is in place.
	useEffect( () => {
		setBlockRemovalRules( rules );
		return () => {
			setBlockRemovalRules();
		};
	}, [ rules, setBlockRemovalRules ] );

	// Reset confirmed state when modal opens with new content.
	useEffect( () => {
		setConfirmed( false );
	}, [ clientIds ] );

	if ( ! message ) {
		return;
	}

	// Normalize message to a structured object. String messages (backward
	// compatibility) are converted to the structured format with defaults.
	const {
		title = __( 'Confirm deletion' ),
		description = message,
		warning,
		subtext,
		requireConfirmation = false,
		confirmLabel = __( 'I understand the consequences' ),
		removeLabel = __( 'Delete' ),
	} = typeof message === 'object' && message !== null ? message : {};

	const isRemoveDisabled = requireConfirmation && ! confirmed;

	const onConfirmRemoval = () => {
		privateRemoveBlocks( clientIds, selectPrevious, /* force */ true );
		clearBlockRemovalPrompt();
	};

	return (
		<Modal
			title={ title }
			onRequestClose={ clearBlockRemovalPrompt }
			size="medium"
		>
			<VStack spacing={ 4 }>
				<div>
					<p>{ description }</p>
					{ ( warning || subtext ) && (
						<p>
							{ warning && <strong>{ warning }</strong> }
							{ warning && subtext && ' ' }
							{ subtext }
						</p>
					) }
				</div>
				{ requireConfirmation && (
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ confirmLabel }
						checked={ confirmed }
						onChange={ setConfirmed }
					/>
				) }
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ clearBlockRemovalPrompt }
						__next40pxDefaultSize
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onConfirmRemoval }
						disabled={ isRemoveDisabled }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ removeLabel }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}
