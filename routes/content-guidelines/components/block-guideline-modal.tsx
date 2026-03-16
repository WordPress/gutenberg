/* @jsx createElement */

/**
 * WordPress dependencies
 */
import {
	BaseControl,
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
import { createElement, useMemo, useRef, useState } from '@wordpress/element';
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
import { useAiGuidelines } from '../ai/use-ai-guidelines';
import DiffEditor from './diff-editor';
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

	// AI generation
	const {
		blockSuggestions,
		blockGeneratingState,
		generateBlock,
		acceptBlockSuggestion,
		dismissBlockSuggestion,
	} = useAiGuidelines();

	const preImproveDraft = useRef< string >( '' );

	const isBlockGenerating =
		selectedBlock &&
		( blockGeneratingState[ selectedBlock ] === 'requesting' ||
			blockGeneratingState[ selectedBlock ] === 'streaming' );

	const showDiff =
		selectedBlock &&
		blockGeneratingState[ selectedBlock ] === 'done' &&
		blockSuggestions[ selectedBlock ] !== undefined;

	// Sync streaming suggestion into guidelineText
	const blockSuggestion = selectedBlock
		? blockSuggestions[ selectedBlock ]
		: undefined;
	if ( blockSuggestion !== undefined && isBlockGenerating ) {
		// During streaming, reflect the partial suggestion
		if ( guidelineText !== blockSuggestion ) {
			setGuidelineText( blockSuggestion );
		}
	}

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
						? __( 'Guidelines saved.' )
						: __( 'Guidelines removed.' ),
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

	const handleGenerate = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		( e.target as HTMLButtonElement ).blur();
		if ( ! selectedBlock ) {
			return;
		}
		preImproveDraft.current = guidelineText;
		generateBlock( selectedBlock );
	};

	const handleAcceptBlock = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		if ( ! selectedBlock ) {
			return;
		}
		// Keep the suggestion in guidelineText (already synced during streaming).
		setGuidelineText( blockSuggestions[ selectedBlock ] || guidelineText );
		acceptBlockSuggestion( selectedBlock );
	};

	const handleDismissBlock = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		if ( ! selectedBlock ) {
			return;
		}
		// Revert to pre-suggestion value.
		setGuidelineText( preImproveDraft.current );
		dismissBlockSuggestion( selectedBlock );
	};

	const canSubmit = selectedBlock && guidelineText.trim().length > 0;
	const isActionDisabled = isSaving || !! showDiff || !! isBlockGenerating;

	const generateLabel = guidelineText.trim().length > 0
		? __( 'Improve guidelines' )
		: __( 'Generate guidelines' );

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
				<BaseControl
					label={ __( 'Guideline text' ) }
					id="block-guideline-text"
				>
					{ showDiff ? (
						<div className="content-guidelines__diff-wrapper has-suggestion">
							<DiffEditor
								original={ preImproveDraft.current }
								suggested={
									blockSuggestions[ selectedBlock! ] || ''
								}
							/>
						</div>
					) : (
						<div
							className={ `block-guideline-modal__textarea-wrapper${
								isBlockGenerating ? ' is-streaming' : ''
							}` }
						>
							<TextareaControl
								label={ __( 'Guideline text' ) }
								hideLabelFromVision
								value={ guidelineText }
								onChange={ setGuidelineText }
								placeholder={ __(
									'Enter guidelines for how this block should be used…'
								) }
								rows={ 6 }
								disabled={ !! isBlockGenerating }
							/>
						</div>
					) }
				</BaseControl>
				{ showDiff && (
					<HStack spacing={ 3 } justify="flex-start" style={ { marginTop: '12px' } }>
						<Button
							variant="primary"
							onClick={ handleAcceptBlock }
							__next40pxDefaultSize
						>
							{ __( 'Accept' ) }
						</Button>
						<Button
							variant="tertiary"
							onClick={ handleDismissBlock }
							__next40pxDefaultSize
						>
							{ __( 'Dismiss' ) }
						</Button>
					</HStack>
				) }
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
					justify="space-between"
					spacing={ 2 }
					className="block-guideline-modal__actions"
				>
					<Button
						variant="secondary"
						onClick={ handleGenerate }
						disabled={ ! selectedBlock || !! isBlockGenerating || !! showDiff }
						accessibleWhenDisabled
						isBusy={ !! isBlockGenerating }
						__next40pxDefaultSize
					>
						{ generateLabel }
					</Button>
					<HStack spacing={ 2 } justify="flex-end">
						{ isEditing && (
							<Button
								variant="tertiary"
								isDestructive
								onClick={ () => handleSave( '' ) }
								disabled={ isActionDisabled }
								accessibleWhenDisabled
							>
								{ __( 'Remove' ) }
							</Button>
						) }
						<Button
							variant="primary"
							onClick={ () => handleSave( guidelineText ) }
							disabled={ ! canSubmit || isActionDisabled }
							isBusy={ isSaving }
							accessibleWhenDisabled
						>
							{ submitButtonLabel }
						</Button>
					</HStack>
				</HStack>
			</VStack>
		</Modal>
	);
}
