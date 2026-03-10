/* @jsx createElement */

/**
 * WordPress dependencies
 */
import {
	Button,
	ComboboxControl,
	Modal,
	TextControl,
	TextareaControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { createElement, useMemo, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	privateApis as blocksPrivateApis,
	store as blocksStore,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { saveContentGuidelines } from '../api';
import { STORE_NAME } from '../store';
import { unlock } from '../../lock-unlock';
import './block-guideline-modal.scss';

const { isContentBlock } = unlock( blocksPrivateApis );

interface BlockGuidelineModalProps {
	closeModal: () => void;
	initialBlock?: string;
}

export default function BlockGuidelineModal( {
	closeModal,
	initialBlock,
}: BlockGuidelineModalProps ) {
	const [ selectedBlock, setSelectedBlock ] = useState< string | undefined >(
		initialBlock
	);

	const [ isSaving, setIsSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const blockGuidelines = useSelect(
		// @ts-ignore
		( select ) => select( STORE_NAME ).getBlockGuidelines(),
		[]
	);

	const isEditing = !! initialBlock;

	const currentGuideline = blockGuidelines[ selectedBlock ] ?? '';
	const [ guidelineText, setGuidelineText ] = useState( currentGuideline );

	const blockOptions = useSelect(
		// @ts-ignore
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);

	const availableBlockOptions = useMemo( () => {
		const set = new Set( Object.keys( blockGuidelines ) );
		if ( initialBlock ) {
			set.delete( initialBlock );
		}
		if ( selectedBlock ) {
			set.delete( selectedBlock );
		}

		return blockOptions
			.filter(
				( block ) =>
					isContentBlock( block.name ) && ! set.has( block.name )
			)
			.map( ( block ) => ( {
				value: block.name,
				label: block.title,
			} ) );
	}, [ blockGuidelines, blockOptions, initialBlock, selectedBlock ] );

	const selectedBlockLabel = useMemo(
		() =>
			blockOptions.find( ( block ) => block.name === selectedBlock )
				?.title || '',
		[ blockOptions, selectedBlock ]
	);

	const { setBlockGuideline } = useDispatch( STORE_NAME );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleSave = ( value: string ) => {
		value = value.trim();
		if ( ! selectedBlock ) {
			return;
		}

		setIsSaving( true );
		const oldValue = blockGuidelines[ selectedBlock ];
		setBlockGuideline( selectedBlock, value );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				createSuccessNotice(
					value
						? __( 'Block guideline saved.' )
						: __( 'Block guideline removed.' ),
					{ type: 'snackbar' }
				);
				closeModal();
			} )
			.catch( ( e: Error ) => {
				setError( e.message );
				setBlockGuideline( selectedBlock, oldValue );
			} )
			.finally( () => setIsSaving( false ) );
	};

	const canSubmit = selectedBlock && guidelineText.trim().length > 0;

	let submitButtonLabel: string = __( 'Add guideline' );
	if ( isSaving ) {
		submitButtonLabel = __( 'Saving…' );
	} else if ( isEditing ) {
		submitButtonLabel = __( 'Update guideline' );
	}

	return (
		<Modal
			className="block-guideline-modal"
			title={
				isEditing
					? __( 'Edit block guidelines' )
					: __( 'Add block guidelines' )
			}
			onRequestClose={ closeModal }
		>
			<VStack spacing={ 4 }>
				{ isEditing ? (
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Block' ) }
						value={ selectedBlockLabel }
						onChange={ () => {} }
						disabled
					/>
				) : (
					<ComboboxControl
						__next40pxDefaultSize
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
					<Notice.Root intent="error">
						<Notice.Title>
							{ sprintf(
								/* translators: %s: Error message. */
								__( 'Error: %s' ),
								error
							) }
						</Notice.Title>
					</Notice.Root>
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
							// We need to pass an empty string to remove the guideline.
							// This is because the API will only remove the guideline if the value is an empty string.
							onClick={ () => handleSave( '' ) }
							disabled={ isSaving }
							accessibleWhenDisabled
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
					>
						{ submitButtonLabel }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}
