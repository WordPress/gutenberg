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
} from '@wordpress/components';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { getBlockType } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { DataForm } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

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
	const fields = createDataFormFields( [ attr ], blockInformation );

	// Create form configuration
	const form = {
		layout: { type: 'regular' },
		fields: [ attr.name ],
	};

	return (
		<div>
			<Flex style={ { marginBottom: '8px' } }>
				<FlexItem>
					<BlockIcon icon={ blockIcon } />
				</FlexItem>
				<FlexItem>
					{ blockInformation?.name || blockInformation?.title }
				</FlexItem>
			</Flex>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ handleChange }
			/>
		</div>
	);
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
	const contentAttributes = useMemo( () => {
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
	}, [ block ] );

	return (
		<VStack spacing={ 2 }>
			<Flex>
				<FlexItem>
					<Navigator.BackButton>
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

			<DataForm
				data={ contentAttributes.reduce( ( acc, attr ) => {
					acc[ attr.name ] = attr.value || '';
					return acc;
				}, {} ) }
				fields={ createDataFormFields(
					contentAttributes,
					blockInformation
				) }
				form={ {
					layout: { type: 'regular' },
					fields: contentAttributes.map( ( attr ) => attr.name ),
				} }
				onChange={ ( edits ) => {
					Object.keys( edits ).forEach( ( key ) => {
						updateBlockAttributes( clientId, {
							[ key ]: edits[ key ],
						} );
					} );
				} }
			/>
		</VStack>
	);
}

// Create DataForm fields from content attributes
function createDataFormFields( contentAttributes, blockInformation ) {
	return contentAttributes.map( ( attr ) => {
		const isUrlAttribute =
			attr.definition.type === 'string' &&
			( attr.name.includes( 'url' ) ||
				attr.name.includes( 'src' ) ||
				attr.name.includes( 'href' ) ||
				attr.name.includes( 'link' ) ||
				attr.definition.attribute === 'href' ||
				attr.definition.attribute === 'src' );

		let fieldType = 'text';
		if ( isUrlAttribute ) {
			fieldType = 'url';
		} else {
			switch ( attr.definition.type ) {
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
			id: attr.name,
			type: fieldType,
			label:
				blockInformation?.name || blockInformation?.title || attr.name,
		};
	} );
}

export default function BlockQuickNavigation( { clientIds, onSelect } ) {
	if ( ! clientIds.length ) {
		return null;
	}
	return (
		<Navigator initialPath="/" style={ { overflow: 'visible' } }>
			<Navigator.Screen path="/" style={ { overflow: 'visible' } }>
				<VStack spacing={ 1 }>
					{ clientIds.map( ( clientId ) => (
						<BlockQuickNavigationItem
							onSelect={ onSelect }
							key={ clientId }
							clientId={ clientId }
						/>
					) ) }
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
	const contentAttributes = [];
	if ( block?.name ) {
		const blockType = getBlockType( block.name );
		if ( blockType?.attributes ) {
			Object.entries( blockType.attributes ).forEach(
				( [ attrName, attrDef ] ) => {
					if ( attrDef.role === 'content' ) {
						contentAttributes.push( {
							name: attrName,
							definition: attrDef,
							value: block.attributes?.[ attrName ],
						} );
					}
				}
			);
		}
	}

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
