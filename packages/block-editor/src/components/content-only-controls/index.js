/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

function RichTextControl() {}

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

function getControlForAttribute( attribute ) {
	if ( attribute.control.type === 'RichText' ) {
		return RichTextControl;
	}
}

function BlockAttributeControl( { attributeDefinition, setAttribute, value } ) {
	const Control = getControlForAttribute( attributeDefinition );

	if ( ! Control ) {
		return null;
	}

	return (
		<ToolsPanelItem>
			<Control value={ value } setAttribute={ setAttribute } />
		</ToolsPanelItem>
	);
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
		return null;
	}

	return (
		<ToolsPanel label={ blockTitle } panelId={ clientId }>
			{ contentAttributesWithControls?.each( ( attribute ) => (
				<BlockAttributeControl
					clientId={ clientId }
					attributeDefinition={ attribute }
					setAttribute={ ( value ) =>
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
