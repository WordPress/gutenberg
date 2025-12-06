/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import {
	VALIDATION_LEVEL,
	getSaveContent,
	getBlockType,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import './style.scss';

/**
 * BlockValidationIndicator shows a visual indicator when a block
 * was regenerated from attributes (Level 3 validation).
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 *
 * @return {Element|null} The validation indicator or null.
 */
export default function BlockValidationIndicator( { clientId } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { validationLevel, block } = useSelect(
		( select ) => {
			const { getBlockValidationLevel, getBlock } =
				select( blockEditorStore );

			return {
				validationLevel: getBlockValidationLevel( clientId ),
				block: getBlock( clientId ),
			};
		},
		[ clientId ]
	);

	const { replaceBlocks } = useDispatch( blockEditorStore );

	// Generate the current content from the block's save function
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
			return `Error generating content: ${ error.message }`;
		}
	}, [ block ] );

	// Only show indicator for Level 3 (RegeneratedBlock)
	if (
		! validationLevel ||
		validationLevel !== VALIDATION_LEVEL.REGENERATED_BLOCK
	) {
		return null;
	}

	// Don't render if block data isn't available
	if ( ! block ) {
		return null;
	}

	const openModal = () => setIsModalOpen( true );
	const closeModal = () => setIsModalOpen( false );

	const handleConvertToHTML = () => {
		if ( ! block?.originalContent ) {
			return;
		}

		// Create an HTML block with the original content
		const htmlBlock = createBlock( 'core/html', {
			content: block.originalContent,
		} );

		// Replace the current block with the HTML block
		replaceBlocks( clientId, htmlBlock );

		closeModal();
	};

	const handleAcceptChanges = () => {
		// Create a new block without validation metadata
		const cleanBlock = {
			...block,
			validationLevel: undefined,
			originalContent: undefined,
		};

		// Replace the block with the cleaned version
		replaceBlocks( clientId, cleanBlock );

		closeModal();
	};

	return (
		<>
			<Button
				className="block-editor-block-validation-indicator"
				onClick={ openModal }
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
					<VStack spacing="5">
						<p className="block-editor-block-validation-modal__description">
							{ __(
								'The content of this block was regenerated from its source attributes because the HTML code was invalid. The updated content will be used when you save this post. If you want to keep the original content, you can convert it to an HTML block.'
							) }
						</p>
						<div className="block-editor-block-validation-modal__comparison">
							<div className="block-editor-block-validation-modal__column">
								<h3>{ __( 'Original content' ) }</h3>
								<pre className="block-editor-block-validation-modal__code">
									{ block?.originalContent || '' }
								</pre>
							</div>
							<div className="block-editor-block-validation-modal__column">
								<h3>{ __( 'Updated content' ) }</h3>
								<pre className="block-editor-block-validation-modal__code block-editor-block-validation-modal__code--updated">
									{ generatedContent }
								</pre>
							</div>
						</div>
						<HStack justify="right">
							<Button
								variant="tertiary"
								onClick={ handleConvertToHTML }
								__next40pxDefaultSize
							>
								{ __( 'Restore original' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ handleAcceptChanges }
								__next40pxDefaultSize
							>
								{ __( 'Accept changes' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }
		</>
	);
}
