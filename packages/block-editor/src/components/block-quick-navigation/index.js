/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	TextControl,
	ToggleControl,
	Popover,
	Navigator,
	Icon,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
	Flex,
	FlexBlock,
	FlexItem,
} from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';
import { getBlockType } from '@wordpress/blocks';
import { useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LinkControl from '../link-control';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayInformation from '../use-block-display-information';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

// Single Content Attribute Control component
function SingleContentAttributeControl( {
	attr,
	clientId,
	updateBlockAttributes,
	singleLinkPopoverOpen,
	setSingleLinkPopoverOpen,
} ) {
	const handleChange = ( newValue ) => {
		updateBlockAttributes( clientId, {
			[ attr.name ]: newValue,
		} );
	};

	const controlType = getControlForAttribute( attr.definition, attr.name );

	if ( controlType === 'TextControl' ) {
		return (
			<TextControl
				key={ attr.name }
				label={ attr.name }
				value={ attr.value || '' }
				onChange={ handleChange }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
		);
	}

	if ( controlType === 'ToggleControl' ) {
		return (
			<ToggleControl
				key={ attr.name }
				label={ attr.name }
				checked={ attr.value || false }
				onChange={ handleChange }
				__nextHasNoMarginBottom
			/>
		);
	}

	if ( controlType === 'LinkControl' ) {
		const linkValue = {
			url: attr.value || '',
			title: '',
			opensInNewTab: false,
		};

		const handleLinkChange = ( newLinkValue ) => {
			updateBlockAttributes( clientId, {
				[ attr.name ]: newLinkValue?.url || '',
			} );
		};

		return (
			<LinkControlWithPopover
				key={ attr.name }
				attrName={ attr.name }
				attrValue={ attr.value }
				linkValue={ linkValue }
				isPopoverOpen={ singleLinkPopoverOpen }
				onTogglePopover={ () =>
					setSingleLinkPopoverOpen( ! singleLinkPopoverOpen )
				}
				onClosePopover={ () => setSingleLinkPopoverOpen( false ) }
				onLinkChange={ handleLinkChange }
				onRemoveLink={ () => {
					updateBlockAttributes( clientId, {
						[ attr.name ]: '',
					} );
					setSingleLinkPopoverOpen( false );
				} }
			/>
		);
	}

	return null;
}

// Block Content Attributes View for Navigator sub-screen
function BlockContentAttributesView( { clientId } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
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

	// State for popover visibility per attribute
	const [ popoverStates, setPopoverStates ] = useState( {} );

	// Helper functions for popover state
	const togglePopover = ( attrName ) => {
		setPopoverStates( ( prev ) => ( {
			...prev,
			[ attrName ]: ! prev[ attrName ],
		} ) );
	};

	const closePopover = ( attrName ) => {
		setPopoverStates( ( prev ) => ( {
			...prev,
			[ attrName ]: false,
		} ) );
	};

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

	return (
		<VStack spacing={ 2 }>
			<Flex>
				<FlexItem>
					<Navigator.BackButton>Back</Navigator.BackButton>
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

			{ contentAttributes.map( ( attr ) => {
				const handleChange = ( newValue ) => {
					updateBlockAttributes( clientId, {
						[ attr.name ]: newValue,
					} );
				};

				const controlType = getControlForAttribute(
					attr.definition,
					attr.name
				);

				if ( controlType === 'TextControl' ) {
					return (
						<TextControl
							key={ attr.name }
							label={ attr.name }
							value={ attr.value || '' }
							onChange={ handleChange }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					);
				}

				if ( controlType === 'ToggleControl' ) {
					return (
						<ToggleControl
							key={ attr.name }
							label={ attr.name }
							checked={ attr.value || false }
							onChange={ handleChange }
							__nextHasNoMarginBottom
						/>
					);
				}

				if ( controlType === 'LinkControl' ) {
					const isPopoverOpen = popoverStates[ attr.name ];
					const linkValue = {
						url: attr.value || '',
						title: '',
						opensInNewTab: false,
					};

					const handleLinkChange = ( newLinkValue ) => {
						updateBlockAttributes( clientId, {
							[ attr.name ]: newLinkValue?.url || '',
						} );
					};

					return (
						<LinkControlWithPopover
							key={ attr.name }
							attrName={ attr.name }
							attrValue={ attr.value }
							linkValue={ linkValue }
							isPopoverOpen={ isPopoverOpen }
							onTogglePopover={ () => togglePopover( attr.name ) }
							onClosePopover={ () => closePopover( attr.name ) }
							onLinkChange={ handleLinkChange }
							onRemoveLink={ () => {
								updateBlockAttributes( clientId, {
									[ attr.name ]: '',
								} );
								closePopover( attr.name );
							} }
						/>
					);
				}

				return null;
			} ) }
		</VStack>
	);
}

// LinkControl with Popover component
function LinkControlWithPopover( {
	attrName,
	attrValue,
	linkValue,
	isPopoverOpen,
	onTogglePopover,
	onClosePopover,
	onLinkChange,
	onRemoveLink,
} ) {
	const buttonRef = useRef( null );

	return (
		<div>
			<Button
				ref={ buttonRef }
				variant="secondary"
				onClick={ onTogglePopover }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			>
				{ attrName }: { attrValue || 'Set link' }
			</Button>
			{ isPopoverOpen && (
				<Popover
					anchor={ buttonRef.current }
					onClose={ onClosePopover }
					placement="bottom-start"
				>
					<LinkControl
						value={ linkValue }
						onChange={ onLinkChange }
						onRemove={ onRemoveLink }
						onCancel={ onClosePopover }
					/>
				</Popover>
			) }
		</div>
	);
}

// Simple mapping function for attribute types to UI controls
function getControlForAttribute( attrDef, attrName ) {
	// Check if this is a URL attribute
	const isUrlAttribute =
		attrDef.type === 'string' &&
		( attrName.includes( 'url' ) ||
			attrName.includes( 'src' ) ||
			attrName.includes( 'href' ) ||
			attrName.includes( 'link' ) ||
			attrDef.attribute === 'href' ||
			attrDef.attribute === 'src' );

	if ( isUrlAttribute ) {
		return 'LinkControl';
	}

	switch ( attrDef.type ) {
		case 'string':
			return 'TextControl';
		case 'boolean':
			return 'ToggleControl';
		case 'rich-text':
			return 'TextControl'; // Using TextControl for now to avoid selection issues
		case 'number':
			return 'TextControl'; // Using TextControl for now, could be NumberControl later
		default:
			return 'TextControl'; // Fallback
	}
}

export default function BlockQuickNavigation( { clientIds, onSelect } ) {
	if ( ! clientIds.length ) {
		return null;
	}
	return (
		<Navigator initialPath="/">
			<Navigator.Screen path="/">
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
		context: 'list-view',
	} );
	const { isSelected, block } = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock, getBlock } =
				select( blockEditorStore );

			return {
				isSelected:
					isBlockSelected( clientId ) ||
					hasSelectedInnerBlock( clientId, /* deep: */ true ),
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

	// State for single LinkControl popover (only used when there's exactly 1 content attribute)
	const [ singleLinkPopoverOpen, setSingleLinkPopoverOpen ] =
		useState( false );

	// If multiple content attributes, show navigation button with chevron
	if ( hasMultipleContentAttributes ) {
		return (
			<Navigator.Button
				path={ `/block/${ clientId }` }
				__next40pxDefaultSize
				isPressed={ isSelected }
				onClick={ async () => {
					await selectBlock( clientId );
					if ( onSelect ) {
						onSelect( clientId );
					}
				} }
			>
				<Flex>
					<FlexItem>
						<BlockIcon icon={ blockInformation?.icon } />
					</FlexItem>
					<FlexBlock style={ { textAlign: 'left' } }>
						<Truncate>{ blockTitle }</Truncate>
					</FlexBlock>
					<FlexItem>
						<Icon icon={ chevronRight } />
					</FlexItem>
				</Flex>
			</Navigator.Button>
		);
	}

	// If single content attribute, show inline controls
	return (
		<VStack spacing={ 1 }>
			<Button
				__next40pxDefaultSize
				isPressed={ isSelected }
				onClick={ async () => {
					await selectBlock( clientId );
					if ( onSelect ) {
						onSelect( clientId );
					}
				} }
			>
				<Flex>
					<FlexItem>
						<BlockIcon icon={ blockInformation?.icon } />
					</FlexItem>
					<FlexBlock style={ { textAlign: 'left' } }>
						<Truncate>{ blockTitle }</Truncate>
					</FlexBlock>
				</Flex>
			</Button>

			{ /* Single content attribute control */ }
			{ contentAttributes.length === 1 && (
				<SingleContentAttributeControl
					attr={ contentAttributes[ 0 ] }
					clientId={ clientId }
					updateBlockAttributes={ updateBlockAttributes }
					singleLinkPopoverOpen={ singleLinkPopoverOpen }
					setSingleLinkPopoverOpen={ setSingleLinkPopoverOpen }
				/>
			) }
		</VStack>
	);
}
