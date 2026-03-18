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
import { Notice } from '../shims/notice';
import { createElement, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { saveContentGuidelines } from '../api';
import { STORE_NAME } from '../store';
import { useAiGuidelines } from '../ai/use-ai-guidelines';
import type { BlockGeneratingState } from '../ai/use-ai-guidelines';
import DiffEditor from './diff-editor';
import './block-guideline-modal.scss';

/**
 * Check if a block type has any attribute with a content role.
 * Replaces the private `isContentBlock` from @wordpress/blocks.
 */
function isContentBlock( blockName: string ): boolean {
	// @ts-ignore – getBlockType is available on the blocks store
	const blockType = wp.data.select( 'core/blocks' ).getBlockType( blockName );
	if ( ! blockType?.attributes ) {
		return false;
	}
	return Object.values( blockType.attributes ).some(
		( attr: any ) => attr?.role === 'content'
	);
}

interface BlockGuidelineModalProps {
	closeModal: () => void;
	initialBlock?: string;
	// Optional shared AI state from parent (Exploration B).
	// When not provided, creates its own local hook instance.
	blockSuggestions?: Record< string, string >;
	blockGeneratingState?: Record< string, BlockGeneratingState >;
	textStreamingKeys?: Record< string, boolean >;
	generateBlock?: ( blockName: string ) => void;
	acceptBlockSuggestion?: ( blockName: string ) => void;
	dismissBlockSuggestion?: ( blockName: string ) => void;
}

export default function BlockGuidelineModal( {
	closeModal,
	initialBlock,
	blockSuggestions: externalBlockSuggestions,
	blockGeneratingState: externalBlockGeneratingState,
	textStreamingKeys: externalTextStreamingKeys,
	generateBlock: externalGenerateBlock,
	acceptBlockSuggestion: externalAcceptBlockSuggestion,
	dismissBlockSuggestion: externalDismissBlockSuggestion,
}: BlockGuidelineModalProps ) {
	// Use shared AI state if provided, otherwise create local instance.
	const localAi = useAiGuidelines();
	const blockSuggestions = externalBlockSuggestions ?? localAi.blockSuggestions;
	const blockGenState = externalBlockGeneratingState ?? localAi.blockGeneratingState;
	const blockTextStreaming = externalTextStreamingKeys ?? localAi.textStreamingKeys;
	const generateBlock = externalGenerateBlock ?? localAi.generateBlock;
	const acceptBlockSuggestion = externalAcceptBlockSuggestion ?? localAi.acceptBlockSuggestion;
	const dismissBlockSuggestion = externalDismissBlockSuggestion ?? localAi.dismissBlockSuggestion;

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

	const preImproveDraft = useRef< string >( '' );
	const [ localAccepted, setLocalAccepted ] = useState( false );

	const isBlockGenerating =
		selectedBlock &&
		( blockGenState[ selectedBlock ] === 'requesting' ||
			blockGenState[ selectedBlock ] === 'streaming' );

	const showDiff =
		! localAccepted &&
		selectedBlock &&
		blockGenState[ selectedBlock ] === 'done' &&
		blockSuggestions[ selectedBlock ] !== undefined;

	// Height tethering: sync textarea and diff wrapper heights on user resize.
	const fieldContainerRef = useRef< HTMLDivElement >( null );
	const [ userFieldHeight, setUserFieldHeight ] = useState< number | null >( null );

	useEffect( () => {
		const container = fieldContainerRef.current;
		if ( ! container ) {
			return;
		}

		let tracking = false;

		const onMouseDown = () => {
			tracking = true;
		};
		const onMouseUp = () => {
			if ( ! tracking ) {
				return;
			}
			tracking = false;
			const el = container.querySelector(
				'textarea, .content-guidelines__diff-wrapper'
			) as HTMLElement | null;
			if ( el ) {
				setUserFieldHeight( el.offsetHeight );
			}
		};

		container.addEventListener( 'mousedown', onMouseDown );
		document.addEventListener( 'mouseup', onMouseUp );
		return () => {
			container.removeEventListener( 'mousedown', onMouseDown );
			document.removeEventListener( 'mouseup', onMouseUp );
		};
	}, [] );

	// Sync streaming suggestion into guidelineText during text streaming phase.
	const isBlockTextStreaming = selectedBlock && blockTextStreaming[ selectedBlock ];
	const blockSuggestion = selectedBlock
		? blockSuggestions[ selectedBlock ]
		: undefined;
	if ( blockSuggestion !== undefined && isBlockTextStreaming ) {
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
				// Clear global suggestion state on successful save.
				if ( blockSuggestions[ selectedBlock ] !== undefined ) {
					acceptBlockSuggestion( selectedBlock );
				}
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
		setLocalAccepted( false );
		generateBlock( selectedBlock );
	};

	const handleAcceptBlock = ( e?: React.MouseEvent ) => {
		e?.preventDefault();
		if ( ! selectedBlock ) {
			return;
		}
		setGuidelineText( blockSuggestions[ selectedBlock ] || guidelineText );
		setLocalAccepted( true );
		// Prevent focus from jumping to the next button after the diff view unmounts.
		requestAnimationFrame( () => {
			( document.activeElement as HTMLElement )?.blur?.();
		} );
	};

	const handleDismissBlock = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		if ( ! selectedBlock ) {
			return;
		}
		const isSuggestionOnly = ! blockGuidelines[ selectedBlock ];
		setGuidelineText( preImproveDraft.current );
		dismissBlockSuggestion( selectedBlock );
		if ( isSuggestionOnly ) {
			closeModal();
		}
	};

	const canSubmit = selectedBlock && guidelineText.trim().length > 0;
	const isActionDisabled = isSaving || !! showDiff || !! isBlockGenerating;

	const generateLabel = guidelineText.trim().length > 0
		? __( 'Improve guidelines' )
		: __( 'Generate guidelines' );

	let submitButtonLabel: string = __( 'Add guidelines' );
	if ( isSaving ) {
		submitButtonLabel = __( 'Saving…' );
	} else if ( isEditing ) {
		submitButtonLabel = __( 'Update guideline' );
	}

	const modalTitle = showDiff
		? __( 'Review suggestion' )
		: isEditing
		? __( 'Edit block guidelines' )
		: __( 'Add block guidelines' );

	return (
		<Modal
			className="block-guideline-modal"
			title={ modalTitle }
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
					<VStack spacing={ 3 }>
						<div
							ref={ fieldContainerRef }
							className={ `content-guidelines__field-container${ isBlockGenerating && ! ( selectedBlock && blockTextStreaming[ selectedBlock ] ) ? ' is-streaming' : '' }` }
							style={
								userFieldHeight
									? ( {
											'--cg-field-height': `${ userFieldHeight }px`,
									  } as React.CSSProperties )
									: undefined
							}
						>
							{ showDiff ? (
								/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
								<div
									className="content-guidelines__diff-wrapper has-suggestion"
									onClick={ handleAcceptBlock }
								>
									<DiffEditor
										original={ preImproveDraft.current }
										suggested={
											blockSuggestions[ selectedBlock! ] || ''
										}
									/>
								</div>
							) : (
								<TextareaControl
									label={ __( 'Guideline text' ) }
									hideLabelFromVision
									value={ guidelineText }
									onChange={ setGuidelineText }
									placeholder={ __(
										'Enter guidelines for how this block should be used…'
									) }
									rows={ 6 }
								/>
							) }
						</div>
						{ /* AI buttons directly under the textarea */ }
						{ showDiff ? (
							<HStack spacing={ 3 } justify="flex-start">
								<Button
									variant="primary"
									onClick={ handleAcceptBlock }
									size="compact"
								>
									{ __( 'Accept suggestion' ) }
								</Button>
								<Button
									variant="tertiary"
									onClick={ handleDismissBlock }
									size="compact"
								>
									{ __( 'Dismiss' ) }
								</Button>
							</HStack>
						) : (
							<HStack spacing={ 3 } justify="flex-start">
								<Button
									variant="secondary"
									onClick={ handleGenerate }
									disabled={
										! selectedBlock || !! isBlockGenerating || !! showDiff
									}
									accessibleWhenDisabled
									size="compact"
								>
									{ generateLabel }
								</Button>
								</HStack>
						) }
					</VStack>
				</BaseControl>
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
					{ isEditing && ! showDiff && (
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
			</VStack>
		</Modal>
	);
}
