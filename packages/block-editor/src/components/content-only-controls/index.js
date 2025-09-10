/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	TextControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

function RichTextControl( { label, value, setValue } ) {
	return (
		<TextControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ label }
			value={ value ? stripHTML( value ) : '' }
			onChange={ setValue }
			autoComplete="off"
		/>
	);
}

function getControlForAttribute( attribute ) {
	if ( attribute.control.type === 'RichText' ) {
		return RichTextControl;
	}
}

function getDefaultValue( attribute ) {
	if ( attribute.default ) {
		return attribute.default;
	}

	return undefined;
}

function BlockAttributeToolsPanelItem( {
	attributeDefinition,
	setValue,
	value,
} ) {
	const Control = getControlForAttribute( attributeDefinition );

	if ( ! Control ) {
		return null;
	}

	const defaultValue = getDefaultValue( attributeDefinition );

	return (
		<ToolsPanelItem
			label={ attributeDefinition.control.label }
			hasValue={ () => value !== defaultValue }
			onDeselect={ () => setValue( defaultValue ) }
			isShownByDefault={ attributeDefinition.control.shownByDefault }
		>
			<Control
				label={ attributeDefinition.control.label }
				value={ value }
				setValue={ setValue }
			/>
		</ToolsPanelItem>
	);
}

function getContentAttributesWithControls( blockType ) {
	return Object.keys( blockType?.attributes ?? {} )
		.filter( ( attributeKey ) => {
			const attribute = blockType.attributes[ attributeKey ];
			return attribute?.role === 'content' && !! attribute.control;
		} )
		.map( ( attributeKey ) => ( {
			key: attributeKey,
			...blockType?.attributes[ attributeKey ],
		} ) );
}

function getResetAllValue( attributes ) {
	const resetValue = {};

	attributes.forEach( ( attribute ) => {
		resetValue[ attribute.key ] = getDefaultValue( attribute );
	} );

	return resetValue;
}

function BlockControls( { clientId } ) {
	const { blockType, attributes } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );
			const { getBlockType } = select( blocksStore );

			const blockName = getBlockName( clientId );

			return {
				blockType: getBlockType( blockName ),
				attributes: getBlockAttributes( clientId ),
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const contentAttributesWithControls =
		getContentAttributesWithControls( blockType );

	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );

	if ( ! contentAttributesWithControls?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no controls.
		// for example, a way to select the block.
		return null;
	}

	return (
		<ToolsPanel
			label={ blockTitle }
			panelId={ clientId }
			resetAll={ () => {
				updateBlockAttributes(
					clientId,
					getResetAllValue( contentAttributesWithControls )
				);
			} }
		>
			{ contentAttributesWithControls?.map( ( attribute ) => (
				<BlockAttributeToolsPanelItem
					key={ clientId }
					clientId={ clientId }
					attributeDefinition={ attribute }
					setValue={ ( value ) =>
						updateBlockAttributes( clientId, {
							[ attribute.key ]: value,
						} )
					}
					value={ attributes[ attribute.key ] }
				/>
			) ) }
		</ToolsPanel>
	);
}

export default function ContentOnlyControls( { clientIds } ) {
	if ( ! clientIds.length ) {
		return null;
	}

	return clientIds.map( ( clientId ) => (
		<BlockControls key={ clientId } clientId={ clientId } />
	) );
}
