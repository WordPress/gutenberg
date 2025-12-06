import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useMemo, useState } from '@wordpress/element';
import {
	VALIDATION_LEVEL,
	createBlock,
	getBlockType,
	getSaveContent,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

interface BlockValidationIndicatorProps {
	/** Client ID of the block. */
	clientId: string;
}

/**
 * Shows an indicator in the block toolbar when a block's markup was
 * regenerated from its attributes while loading (validation Level 3,
 * `REGENERATED_BLOCK`), with a modal comparing the stored and the
 * regenerated markup. Blocks reconstructed at Level 2 only gain attributes,
 * so nothing is shown for them.
 *
 * @param props          Component props.
 * @param props.clientId Block client ID.
 *
 * @return The indicator, or null when the block was not regenerated.
 */
export default function BlockValidationIndicator( {
	clientId,
}: BlockValidationIndicatorProps ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);

	const { replaceBlock } = useDispatch( blockEditorStore );

	// The markup the block will be saved with.
	const generatedContent = useMemo( () => {
		if ( ! block ) {
			return '';
		}

		const blockType = getBlockType( block.name );
		if ( ! blockType ) {
			return '';
		}

		try {
			return getSaveContent( blockType, block.attributes );
		} catch ( error ) {
			return ( error as Error ).message;
		}
	}, [ block ] );

	if (
		! block ||
		block.validationLevel !== VALIDATION_LEVEL.REGENERATED_BLOCK
	) {
		return null;
	}

	const closeModal = () => setIsModalOpen( false );

	// Keep the stored markup instead, as an HTML block.
	const restoreOriginal = () => {
		replaceBlock(
			clientId,
			createBlock( 'core/html', {}, [], [ block.originalContent ?? '' ] )
		);
		closeModal();
	};

	// Keep the regenerated block, without its validation metadata.
	const acceptChanges = () => {
		replaceBlock(
			clientId,
			createBlock( block.name, block.attributes, block.innerBlocks )
		);
		closeModal();
	};

	return (
		<>
			<Button
				className="block-editor-block-validation-indicator"
				onClick={ () => setIsModalOpen( true ) }
				label={ __( 'This block was regenerated.' ) }
				showTooltip
				__next40pxDefaultSize
			>
				<span className="block-editor-block-validation-indicator__dot" />
			</Button>

			{ isModalOpen && (
				<Modal
					title={ __( 'This block encountered a problem' ) }
					onRequestClose={ closeModal }
					className="block-editor-block-validation-modal"
					size="large"
				>
					<Stack direction="column" gap="lg">
						<p className="block-editor-block-validation-modal__description">
							{ __(
								'The content of this block was regenerated from its source attributes because the HTML code was invalid. The updated content will be used when you save this post. If you want to keep the original content, you can convert it to an HTML block.'
							) }
						</p>
						<div className="block-editor-block-validation-modal__comparison">
							<div className="block-editor-block-validation-modal__column">
								<h3>{ __( 'Original content' ) }</h3>
								<pre className="block-editor-block-validation-modal__code">
									{ block.originalContent ?? '' }
								</pre>
							</div>
							<div className="block-editor-block-validation-modal__column">
								<h3>{ __( 'Updated content' ) }</h3>
								<pre className="block-editor-block-validation-modal__code block-editor-block-validation-modal__code--updated">
									{ generatedContent }
								</pre>
							</div>
						</div>
						<Stack direction="row" justify="flex-end">
							<Button
								variant="tertiary"
								onClick={ restoreOriginal }
								__next40pxDefaultSize
							>
								{ __( 'Restore original' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ acceptChanges }
								__next40pxDefaultSize
							>
								{ __( 'Accept changes' ) }
							</Button>
						</Stack>
					</Stack>
				</Modal>
			) }
		</>
	);
}
