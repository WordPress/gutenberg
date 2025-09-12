/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Navigator,
	Icon,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
	Flex,
	FlexBlock,
	FlexItem,
	__experimentalView as View,
	Button,
} from '@wordpress/components';
import { chevronRight, chevronLeft, media } from '@wordpress/icons';
import { getBlockType } from '@wordpress/blocks';
import { DataForm } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import ContentOnlyBlockEditor from '../content-only-editor';
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';

// Image Media Selector Component
function ImageMediaSelector( { value, onChange } ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				onSelect={ ( selectedMedia ) => {
					onChange( selectedMedia.url );
				} }
				allowedTypes={ [ 'image' ] }
				value={ value }
				render={ ( { open } ) => (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ open }
						icon={ media }
						style={ { width: '100%' } }
					>
						{ value ? 'Change Image' : 'Select Image' }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}

// Single Content Attribute Control component using DataForm
function SingleContentAttributeControl( {
	attr,
	clientId,
	updateBlockAttributes,
	blockIcon,
	blockInformation,
} ) {
	// Safety check for attr object
	if ( ! attr || ! attr.definition ) {
		return null;
	}

	const handleChange = ( edits ) => {
		Object.keys( edits ).forEach( ( key ) => {
			updateBlockAttributes( clientId, {
				[ key ]: edits[ key ],
			} );
		} );
	};

	// Create data object
	const data = { [ attr.name ]: attr.value || '' };

	// Create fields for DataForm
	const fields = createDataFormFields( [ attr ] );

	// Create form configuration
	const form = {
		layout: {
			type: 'regular',
			labelPosition: 'none',
		},
		fields: [ attr.name ],
	};

	return (
		<VStack spacing={ 1 }>
			<View>
				<Flex justify="flex-start">
					<FlexItem>
						<BlockIcon icon={ blockIcon } />
					</FlexItem>
					<FlexItem>
						{ blockInformation?.name || blockInformation?.title }
					</FlexItem>
				</Flex>
			</View>
			<View>
				{ isImageSrcAttribute( attr ) ? (
					<ImageMediaSelector
						value={ attr.value || '' }
						onChange={ ( newValue ) => {
							handleChange( { [ attr.name ]: newValue } );
						} }
					/>
				) : (
					<DataForm
						data={ data }
						fields={ fields }
						form={ form }
						onChange={ handleChange }
					/>
				) }
			</View>
		</VStack>
	);
}

function getEditableContentAttributes( block ) {
	const attributes = [];
	if ( block?.name ) {
		const blockType = getBlockType( block.name );
		if ( blockType?.attributes ) {
			Object.entries( blockType.attributes ).forEach(
				( [ attrName, attrDef ] ) => {
					if ( attrDef.role === 'content' ) {
						attributes.push( {
							name: attrName,
							definition: attrDef,
							value: block.attributes?.[ attrName ],
						} );
					}
				}
			);
		}
	}
	return attributes;
}
// Block Content Attributes View for Navigator sub-screen
function BlockContentAttributesView( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
	} );
	const { block } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			return {
				block: getBlock( clientId ),
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// Get content attributes for this block
	const contentAttributes = getEditableContentAttributes( block );

	// Separate image src attributes from other attributes
	const imageSrcAttributes = contentAttributes.filter( isImageSrcAttribute );
	const otherAttributes = contentAttributes.filter(
		( contentAttribute ) => ! isImageSrcAttribute( contentAttribute )
	);

	const handleAttributeChange = ( edits ) => {
		Object.keys( edits ).forEach( ( key ) => {
			updateBlockAttributes( clientId, {
				[ key ]: edits[ key ],
			} );
		} );
	};

	return (
		<VStack spacing={ 2 }>
			<Flex>
				<FlexItem>
					<Navigator.BackButton style={ { paddingLeft: 0 } }>
						<Icon icon={ chevronLeft } />
					</Navigator.BackButton>
				</FlexItem>
				<FlexBlock>
					<Flex>
						<FlexItem>
							<BlockIcon icon={ blockInformation?.icon } />
						</FlexItem>
						<FlexBlock>
							<Truncate>{ blockTitle }</Truncate>
						</FlexBlock>
					</Flex>
				</FlexBlock>
			</Flex>
			{ /* Render ImageMediaSelector for image src attributes */ }
			{ imageSrcAttributes.map( ( attr ) => (
				<ImageMediaSelector
					key={ attr.name }
					value={ attr.value || '' }
					onChange={ ( newValue ) => {
						handleAttributeChange( { [ attr.name ]: newValue } );
					} }
				/>
			) ) }
			{ /* Render DataForm for other attributes */ }
			{ otherAttributes.length > 0 && (
				<DataForm
					data={ otherAttributes.reduce( ( acc, attr ) => {
						acc[ attr.name ] = attr.value || '';
						return acc;
					}, {} ) }
					fields={ createDataFormFields( otherAttributes ) }
					form={ {
						layout: {
							type: 'regular',
						},
						fields: otherAttributes.map( ( attr ) => attr.name ),
					} }
					onChange={ handleAttributeChange }
				/>
			) }
		</VStack>
	);
}

// Group successive paragraph and list blocks
function groupContentBlocks( clientIds, blocks ) {
	const groups = [];
	let currentGroup = [];

	for ( let i = 0; i < clientIds.length; i++ ) {
		const clientId = clientIds[ i ];
		const block = blocks.find( ( b ) => b.clientId === clientId );

		if (
			block &&
			( block.name === 'core/paragraph' || block.name === 'core/list' )
		) {
			currentGroup.push( clientId );
		} else {
			if ( currentGroup.length > 0 ) {
				groups.push( currentGroup );
				currentGroup = [];
			}
			groups.push( [ clientId ] );
		}
	}

	if ( currentGroup.length > 0 ) {
		groups.push( currentGroup );
	}
	return groups;
}

const isUrlAttribute = ( contentAttribute ) => {
	return (
		contentAttribute.definition.type === 'string' &&
		( contentAttribute.definition.attribute === 'href' ||
			contentAttribute.definition.attribute === 'src' )
	);
};

const isImageSrcAttribute = ( contentAttribute ) => {
	return (
		contentAttribute.definition.attribute === 'src' &&
		contentAttribute.definition.selector === 'img'
	);
};

// Create DataForm fields from content attributes
function createDataFormFields( contentAttributes ) {
	return contentAttributes
		.map( ( contentAttribute ) => {
			let fieldType = 'text';
			if ( isImageSrcAttribute( contentAttribute ) ) {
				// Skip image src attributes as they're handled separately
				return null;
			} else if ( isUrlAttribute( contentAttribute ) ) {
				fieldType = 'url';
			} else {
				switch ( contentAttribute.definition.type ) {
					case 'boolean':
						fieldType = 'toggle';
						break;
					case 'rich-text':
						fieldType = 'text';
						break;
					case 'number':
						fieldType = 'text';
						break;
					default:
						fieldType = 'text';
				}
			}

			return {
				id: contentAttribute.name,
				type: fieldType,
				label: contentAttribute.name,
			};
		} )
		.filter( Boolean );
}

export default function BlockQuickNavigation( { clientIds, onSelect } ) {
	// Get all blocks for the client IDs
	const blocks = useSelect(
		( select ) => {
			const { getBlocksByClientId } = select( blockEditorStore );
			return getBlocksByClientId( clientIds );
		},
		[ clientIds ]
	);

	if ( ! clientIds.length ) {
		return null;
	}

	// Group consecutive paragraph and list blocks
	const blockGroups = groupContentBlocks( clientIds, blocks );

	return (
		<Navigator initialPath="/" style={ { overflow: 'visible' } }>
			<Navigator.Screen path="/" style={ { overflow: 'visible' } }>
				<VStack spacing={ 1 }>
					{ blockGroups.map( ( group, groupIndex ) => {
						// Check if this group contains only paragraph and list blocks
						const isContentGroup = group.every( ( clientId ) => {
							const block = blocks.find(
								( b ) => b.clientId === clientId
							);
							return (
								block &&
								( block.name === 'core/paragraph' ||
									block.name === 'core/list' )
							);
						} );

						if ( isContentGroup && group.length > 1 ) {
							// Get the blocks for this group
							const groupedContentBlocks = group
								.map( ( clientId ) =>
									blocks.find(
										( b ) => b.clientId === clientId
									)
								)
								.filter( Boolean );
							// Render ContentOnlyBlockEditor for grouped content blocks
							return (
								<div>
									<h3>Content</h3>
									<ContentOnlyBlockEditor
										key={ `content-only-block-editor-${ groupIndex }` }
										blocks={ groupedContentBlocks }
									/>
								</div>
							);
						}

						// Render individual blocks for non-content groups or single blocks
						return group.map( ( clientId ) => (
							<BlockQuickNavigationItem
								onSelect={ onSelect }
								key={ clientId }
								clientId={ clientId }
							/>
						) );
					} ) }
				</VStack>
			</Navigator.Screen>
			{ clientIds.map( ( clientId ) => (
				<Navigator.Screen
					key={ clientId }
					path={ `/block/${ clientId }` }
				>
					<BlockContentAttributesView clientId={ clientId } />
				</Navigator.Screen>
			) ) }
		</Navigator>
	);
}

function BlockQuickNavigationItem( { clientId, onSelect } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
	} );
	const { block } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );

			return {
				block: getBlock( clientId ),
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes, selectBlock } =
		useDispatch( blockEditorStore );

	// Get content attributes for this block
	const contentAttributes = getEditableContentAttributes( block );

	// Determine if this block has multiple content attributes
	const hasMultipleContentAttributes = contentAttributes.length > 1;

	// If multiple content attributes, show navigation button with chevron
	if ( hasMultipleContentAttributes ) {
		return (
			<Navigator.Button
				path={ `/block/${ clientId }` }
				__next40pxDefaultSize
				onClick={ async () => {
					await selectBlock( clientId );
					if ( onSelect ) {
						onSelect( clientId );
					}
				} }
				style={ {
					width: 'calc(100% + 16px)',
					marginLeft: '-8px',
					overflow: 'visible',
				} }
			>
				<Flex>
					<Flex justify="flex-start">
						<FlexItem>
							<BlockIcon icon={ blockInformation?.icon } />
						</FlexItem>
						<FlexItem>
							<Truncate>{ blockTitle }</Truncate>
						</FlexItem>
					</Flex>
					<FlexItem>
						<Icon icon={ chevronRight } />
					</FlexItem>
				</Flex>
			</Navigator.Button>
		);
	}

	// If single content attribute, show inline controls without block title
	if ( contentAttributes.length === 1 && contentAttributes[ 0 ] ) {
		return (
			<SingleContentAttributeControl
				attr={ contentAttributes[ 0 ] }
				clientId={ clientId }
				updateBlockAttributes={ updateBlockAttributes }
				blockIcon={ blockInformation?.icon }
				blockInformation={ blockInformation }
			/>
		);
	}
}
