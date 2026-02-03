/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	SelectControl,
	Spinner,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BlockGuidelines } from '../../store/constants';

interface BlockTypeResponse {
	name: string;
	title: string | { rendered: string } | null;
}

interface BlockType {
	name: string;
	title: string;
}

interface BlockGuidelinesRowProps {
	value: BlockGuidelines;
	onChange: ( value: BlockGuidelines ) => void;
	description: string;
	isSaving?: boolean;
}

/**
 * Extracts the title string from a block type response.
 *
 * @param block Block type response object.
 * @return Normalized title string.
 */
function extractBlockTitle( block: BlockTypeResponse ): string {
	if ( typeof block.title === 'string' ) {
		return block.title;
	}
	if ( block.title && typeof block.title === 'object' ) {
		return block.title.rendered;
	}
	return block.name;
}

/**
 * Block guidelines row component for managing per-block guidelines.
 *
 * @param props             Component props.
 * @param props.value       Current block guidelines object.
 * @param props.onChange    Callback when block guidelines change.
 * @param props.description Help text for the block guidelines.
 * @param props.isSaving    Whether the block guidelines are currently being saved.
 * @return BlockGuidelinesRow component.
 */
export default function BlockGuidelinesRow( {
	value,
	onChange,
	description,
	isSaving = false,
}: BlockGuidelinesRowProps ) {
	const [ selectedBlock, setSelectedBlock ] = useState( '' );
	const [ blockTypes, setBlockTypes ] = useState< BlockType[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isAddingBlock, setIsAddingBlock ] = useState( false );
	const [ draftGuidelines, setDraftGuidelines ] = useState( '' );
	const wasSaving = useRef( false );

	// Reset selection when save completes
	useEffect( () => {
		if ( wasSaving.current && ! isSaving ) {
			setSelectedBlock( '' );
			setIsAddingBlock( false );
		}
		wasSaving.current = isSaving;
	}, [ isSaving ] );

	useEffect( () => {
		async function fetchBlockTypes(): Promise< void > {
			try {
				const response = await apiFetch< BlockTypeResponse[] >( {
					path: '/wp/v2/block-types',
				} );
				const processedBlocks = response
					.map( ( block ) => ( {
						name: block.name,
						title: extractBlockTitle( block ),
					} ) )
					.filter( ( block ) => block.name && block.title );
				setBlockTypes( processedBlocks );
			} catch ( err ) {
				// eslint-disable-next-line no-console
				console.error( 'Failed to fetch block types:', err );
			} finally {
				setIsLoading( false );
			}
		}

		fetchBlockTypes();
	}, [] );

	// Sort blocks alphabetically by title.
	const sortedBlockTypes = [ ...blockTypes ].sort( ( a, b ) =>
		( a.title || '' ).localeCompare( b.title || '' )
	);

	const blockOptions = sortedBlockTypes.map( ( block ) => ( {
		label: block.title,
		value: block.name,
	} ) );

	const handleRemoveBlockGuideline = ( blockName: string ) => {
		const newValue = { ...value };
		delete newValue[ blockName ];
		onChange( newValue );

		if ( selectedBlock === blockName ) {
			setSelectedBlock( '' );
		}
	};

	const getBlockTitle = ( blockName: string ): string => {
		const block = blockTypes.find( ( b ) => b.name === blockName );
		return block?.title || blockName;
	};

	const configuredBlocks = Object.entries( value ).filter(
		( [ , data ] ) => data.guidelines && data.guidelines.trim() !== ''
	);

	const handleEditBlock = ( blockName: string ) => {
		setSelectedBlock( blockName );
		setDraftGuidelines( value[ blockName ]?.guidelines || '' );
		setIsAddingBlock( true );
	};

	const handleCancelAdd = () => {
		setSelectedBlock( '' );
		setDraftGuidelines( '' );
		setIsAddingBlock( false );
	};

	const handleAddBlockGuideline = () => {
		if ( selectedBlock && draftGuidelines.trim() ) {
			onChange( {
				...value,
				[ selectedBlock ]: { guidelines: draftGuidelines },
			} );
			setSelectedBlock( '' );
			setDraftGuidelines( '' );
			setIsAddingBlock( false );
		}
	};

	return (
		<tr>
			<th scope="row">{ __( 'Block-Specific' ) }</th>
			<td>
				<p className="description block-guidelines-description">
					{ description }
				</p>

				{ configuredBlocks.length > 0 && (
					<div className="block-guidelines-list">
						<div className="block-guidelines-list__items">
							{ configuredBlocks.map( ( [ blockName, data ] ) => (
								<div
									key={ blockName }
									className="block-guideline-item"
								>
									<div className="block-guideline-item__header">
										<strong className="block-guideline-item__title">
											{ getBlockTitle( blockName ) }
										</strong>
										<span className="block-guideline-item__actions">
											<Button
												variant="link"
												onClick={ () =>
													handleEditBlock( blockName )
												}
											>
												{ __( 'Edit' ) }
											</Button>
											<span className="block-guideline-item__separator">
												|
											</span>
											<Button
												variant="link"
												isDestructive
												onClick={ () =>
													handleRemoveBlockGuideline(
														blockName
													)
												}
											>
												{ __( 'Remove' ) }
											</Button>
										</span>
									</div>
									<p className="block-guideline-item__content">
										{ data.guidelines }
									</p>
								</div>
							) ) }
						</div>
					</div>
				) }

				{ isAddingBlock ? (
					<div className="block-guidelines-add-form">
						{ isLoading ? (
							<div className="block-guidelines-loading">
								<Spinner />
								<span>{ __( 'Loading block types…' ) }</span>
							</div>
						) : (
							<SelectControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Select Block Type' ) }
								value={ selectedBlock }
								options={ [
									{
										label: __( 'Select a block…' ),
										value: '',
									},
									...blockOptions,
								] }
								onChange={ setSelectedBlock }
							/>
						) }

						{ selectedBlock && (
							<div className="block-guidelines-editor">
								<TextareaControl
									__nextHasNoMarginBottom
									label={ __(
										'Enter guidelines specific to this block type.'
									) }
									hideLabelFromVision
									value={ draftGuidelines }
									onChange={ setDraftGuidelines }
									rows={ 4 }
									help={ __(
										'Enter guidelines specific to this block type.'
									) }
								/>
							</div>
						) }

						<div className="block-guidelines-form-actions">
							<Button
								variant="primary"
								onClick={ handleAddBlockGuideline }
								disabled={
									! selectedBlock || ! draftGuidelines.trim()
								}
								accessibleWhenDisabled
								__next40pxDefaultSize
							>
								{ __( 'Add' ) }
							</Button>
							<Button variant="link" onClick={ handleCancelAdd }>
								{ __( 'Cancel' ) }
							</Button>
						</div>
					</div>
				) : (
					<Button
						variant="secondary"
						onClick={ () => setIsAddingBlock( true ) }
						__next40pxDefaultSize
					>
						{ __( '+ Add Block Guidelines' ) }
					</Button>
				) }
			</td>
		</tr>
	);
}
