/**
 * WordPress dependencies
 */
import {
	Button,
	ComboboxControl,
	Modal,
	Notice,
	TextControl,
	TextareaControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { blockSlug, saveGuidelineRow, deleteGuidelineRow } from '../data';
import type { ContentBlock, GuidelineRow, GuidelineQuery } from '../types';
import './block-guideline-modal.scss';

interface BlockGuidelineModalProps {
	closeModal: () => void;
	initialBlock?: string;
	contentBlocks: ContentBlock[];
	bySlug: Record< string, GuidelineRow >;
	query: GuidelineQuery;
}

export default function BlockGuidelineModal( {
	closeModal,
	initialBlock,
	contentBlocks,
	bySlug,
	query,
}: BlockGuidelineModalProps ) {
	const [ selectedBlock, setSelectedBlock ] = useState< string | undefined >(
		initialBlock
	);

	const [ isSaving, setIsSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ showRemoveConfirmation, setShowRemoveConfirmation ] =
		useState( false );

	const isEditing = !! initialBlock;

	const currentGuideline = selectedBlock
		? bySlug[ blockSlug( selectedBlock ) ]?.content ?? ''
		: '';
	const [ guidelineText, setGuidelineText ] = useState( currentGuideline );

	const availableBlockOptions = useMemo( () => {
		return contentBlocks
			.filter(
				( block ) =>
					! bySlug[ blockSlug( block.name ) ] ||
					block.name === selectedBlock
			)
			.filter( ( block ) => block.name !== initialBlock )
			.map( ( block ) => ( {
				value: block.name,
				label: block.title,
			} ) );
	}, [ contentBlocks, bySlug, initialBlock, selectedBlock ] );

	const selectedBlockLabel = useMemo(
		() =>
			contentBlocks.find( ( block ) => block.name === selectedBlock )
				?.title || '',
		[ contentBlocks, selectedBlock ]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleSave = ( value: string ) => {
		value = value.trim();
		if ( ! selectedBlock ) {
			return;
		}

		setIsSaving( true );
		const slug = blockSlug( selectedBlock );
		const existingId = bySlug[ slug ]?.id;

		let operation: Promise< void >;
		if ( value ) {
			operation = saveGuidelineRow(
				slug,
				selectedBlock,
				value,
				existingId,
				query
			);
		} else if ( existingId ) {
			operation = deleteGuidelineRow( existingId );
		} else {
			operation = Promise.resolve();
		}

		operation
			.then( () => {
				setError( null );
				createSuccessNotice(
					value
						? __( 'Guidelines saved.' )
						: __( 'Guidelines removed.' ),
					{ type: 'snackbar' }
				);
				closeModal();
			} )
			.catch( ( e: Error ) => setError( e.message ) )
			.finally( () => setIsSaving( false ) );
	};

	const canSubmit = selectedBlock && guidelineText.trim().length > 0;

	let submitButtonLabel: string = __( 'Save guidelines' );
	if ( isSaving ) {
		submitButtonLabel = __( 'Saving…' );
	}

	return (
		<Modal
			className="block-guideline-modal"
			title={
				isEditing ? __( 'Edit guidelines' ) : __( 'Add guidelines' )
			}
			onRequestClose={ closeModal }
		>
			<VStack spacing={ 4 }>
				{ isEditing ? (
					<TextControl
						label={ __( 'Block' ) }
						value={ selectedBlockLabel }
						onChange={ () => {} }
						disabled
					/>
				) : (
					<ComboboxControl
						label={ __( 'Block' ) }
						options={ availableBlockOptions }
						value={ selectedBlock }
						onChange={ ( value ) =>
							setSelectedBlock( value ?? undefined )
						}
						placeholder={ __( 'Search for a block…' ) }
					/>
				) }
				<TextareaControl
					label={ __( 'Guideline text' ) }
					value={ guidelineText }
					onChange={ setGuidelineText }
					placeholder={ __(
						'Enter guidelines for how this block should be used…'
					) }
					rows={ 6 }
				/>
				{ error && (
					<Notice status="error" onRemove={ () => setError( null ) }>
						{ sprintf(
							/* translators: %s: Error message. */
							__( 'Error: %s' ),
							error
						) }
					</Notice>
				) }
				<HStack
					justify="flex-end"
					spacing={ 2 }
					className="block-guideline-modal__actions"
				>
					{ isEditing && (
						<Button
							variant="tertiary"
							isDestructive
							onClick={ () => setShowRemoveConfirmation( true ) }
							disabled={ isSaving }
							accessibleWhenDisabled
							type="button"
							__next40pxDefaultSize
						>
							{ __( 'Remove' ) }
						</Button>
					) }
					<Button
						variant="primary"
						onClick={ () => handleSave( guidelineText ) }
						disabled={ ! canSubmit || isSaving }
						isBusy={ isSaving }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ submitButtonLabel }
					</Button>
				</HStack>
			</VStack>
			<ConfirmDialog
				isOpen={ showRemoveConfirmation }
				title={ __( 'Remove block guidelines' ) }
				__experimentalHideHeader={ false }
				onConfirm={ () => {
					handleSave( '' );
					setShowRemoveConfirmation( false );
				} }
				onCancel={ () => setShowRemoveConfirmation( false ) }
				confirmButtonText={ __( 'Remove' ) }
				isBusy={ isSaving }
				size="small"
			>
				{ sprintf(
					/* translators: %s: Block name. */
					__(
						'You are about to remove the block guidelines for the %s block.'
					),
					selectedBlockLabel
				) }
			</ConfirmDialog>
		</Modal>
	);
}
