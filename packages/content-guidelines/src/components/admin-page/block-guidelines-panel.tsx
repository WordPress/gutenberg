/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';

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

interface BlockGuidelinesPanelProps {
	value: BlockGuidelines;
	onChange: ( value: BlockGuidelines ) => void;
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
 * Truncates text to a maximum length with ellipsis.
 *
 * @param text      Text to truncate.
 * @param maxLength Maximum length before truncation.
 * @return Truncated text with ellipsis if needed.
 */
function truncateText( text: string, maxLength: number ): string {
	if ( text.length <= maxLength ) {
		return text;
	}
	return `${ text.substring( 0, maxLength ) }...`;
}

/**
 * Block guidelines panel component for managing per-block guidelines.
 *
 * @param props          Component props.
 * @param props.value    Current block guidelines object.
 * @param props.onChange Callback when block guidelines change.
 * @return BlockGuidelinesPanel component.
 */
export default function BlockGuidelinesPanel( {
	value,
	onChange,
}: BlockGuidelinesPanelProps ) {
	const [ selectedBlock, setSelectedBlock ] = useState( '' );
	const [ blockTypes, setBlockTypes ] = useState< BlockType[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );

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

	const handleBlockGuidelineChange = (
		blockName: string,
		guidelines: string
	) => {
		onChange( {
			...value,
			[ blockName ]: { guidelines },
		} );
	};

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

	return (
		<PanelBody
			title={ __( 'Block-Specific Guidelines' ) }
			initialOpen={ false }
		>
			{ isLoading ? (
				<div className="block-guidelines-loading">
					<Spinner />
					<span>{ __( 'Loading block types…' ) }</span>
				</div>
			) : (
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Select Block Types' ) }
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
						label={ getBlockTitle( selectedBlock ) }
						value={ value[ selectedBlock ]?.guidelines || '' }
						onChange={ ( text: string ) =>
							handleBlockGuidelineChange( selectedBlock, text )
						}
						rows={ 4 }
						help={ __(
							'Enter guidelines specific to this block type.'
						) }
					/>
				</div>
			) }

			{ configuredBlocks.length > 0 && (
				<div className="block-guidelines-list">
					<h4 className="block-guidelines-list__title">
						{ __( 'Configured Blocks' ) }
					</h4>
					<ul className="block-guidelines-list__items">
						{ configuredBlocks.map( ( [ blockName, data ] ) => (
							<li
								key={ blockName }
								className="block-guideline-item"
							>
								<div className="block-guideline-item__content">
									<strong className="block-guideline-item__title">
										{ getBlockTitle( blockName ) }
									</strong>
									<p className="block-guideline-item__preview">
										{ truncateText( data.guidelines, 100 ) }
									</p>
								</div>
								<Button
									icon={ trash }
									label={ __( 'Remove' ) }
									onClick={ () =>
										handleRemoveBlockGuideline( blockName )
									}
									isDestructive
									size="small"
								/>
							</li>
						) ) }
					</ul>
				</div>
			) }
		</PanelBody>
	);
}
