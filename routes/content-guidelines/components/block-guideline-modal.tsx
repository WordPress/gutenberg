/**
 * WordPress dependencies
 */
import {
	Button,
	ComboboxControl,
	Modal,
	TextareaControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { saveContentGuidelines } from '../api';
import { STORE_NAME } from '../store';
import './block-guideline-modal.scss';

interface BlockGuidelineModalProps {
	closeModal: () => void;
	initialBlock?: string;
}

export default function BlockGuidelineModal( {
	closeModal,
	initialBlock,
}: BlockGuidelineModalProps ) {
	const [ guidelineText, setGuidelineText ] = useState( '' );
	const [ selectedBlock, setSelectedBlock ] = useState< string | undefined >(
		initialBlock
	);

	const [ isSaving, setIsSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const currentGuideline = useSelect(
		// @ts-ignore
		( select ) => select( STORE_NAME ).getBlockGuideline( selectedBlock ),
		[ selectedBlock ]
	);

	const isEditing = !! currentGuideline;

	useEffect( () => {
		setSelectedBlock( initialBlock );
	}, [ initialBlock ] );

	useEffect( () => {
		setGuidelineText( currentGuideline ?? '' );
	}, [ currentGuideline ] );

	const blockOptions = useSelect(
		// @ts-ignore
		( select ) => select( blocksStore ).getBlockTypes(),
		[]
	);

	const { setBlockGuideline } = useDispatch( STORE_NAME );

	const handleAddGuideline = () => {
		if ( ! selectedBlock || ! guidelineText.trim() ) {
			return;
		}
		setIsSaving( true );
		setBlockGuideline( selectedBlock, guidelineText.trim() );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				closeModal();
			} )
			.catch( ( e: Error ) => setError( e.message ) )
			.finally( () => setIsSaving( false ) );
	};

	const handleRemoveGuideline = () => {
		if ( ! selectedBlock ) {
			return;
		}
		setIsSaving( true );
		setBlockGuideline( selectedBlock, '' );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				closeModal();
			} )
			.catch( ( e: Error ) => {
				setError( e.message );
				setBlockGuideline( selectedBlock, currentGuideline );
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
				<ComboboxControl
					__next40pxDefaultSize
					label={ __( 'Block' ) }
					options={ blockOptions.map( ( block ) => ( {
						value: block.name,
						label: block.title,
					} ) ) }
					value={ selectedBlock }
					onChange={ ( value ) =>
						setSelectedBlock( value ?? undefined )
					}
					placeholder={ __( 'Search for a block…' ) }
				/>
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
							onClick={ handleRemoveGuideline }
							disabled={ isSaving }
						>
							{ __( 'Remove' ) }
						</Button>
					) }
					<Button
						variant="primary"
						onClick={ handleAddGuideline }
						disabled={ ! canSubmit || isSaving }
						isBusy={ isSaving }
					>
						{ submitButtonLabel }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}
