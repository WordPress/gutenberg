/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	TextControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import useBlockDisplayInformation from '../use-block-display-information';

const controls = {
	RichText( {
		clientId,
		control,
		blockType,
		attributeValues,
		updateAttributes,
	} ) {
		const valueKey = control.mapping.value;
		const value = attributeValues[ valueKey ];
		const defaultValue = blockType.attributes[ valueKey ]?.defaultValue;

		return (
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => value !== defaultValue }
				onDeselect={ () => {
					updateAttributes( { [ valueKey ]: defaultValue } );
				} }
				isShownByDefault={ control.shownByDefault }
			>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ control.label }
					value={ value ? stripHTML( value ) : '' }
					onChange={ ( newValue ) => {
						updateAttributes( { [ valueKey ]: newValue } );
					} }
					autoComplete="off"
				/>
			</ToolsPanelItem>
		);
	},
	Media( {
		clientId,
		control,
		blockType,
		attributeValues,
		updateAttributes,
	} ) {
		return (
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => false } // TODO.
				onDeselect={ () => {
					// TODO.
				} }
				isShownByDefault={ control.shownByDefault }
			>
				Media
			</ToolsPanelItem>
		);
	},
	Link( {
		clientId,
		control,
		blockType,
		attributeValues,
		updateAttributes,
	} ) {
		return (
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => true } // TODO.
				onDeselect={ () => {
					// TODO.
				} }
				isShownByDefault={ control.shownByDefault }
			>
				Link
			</ToolsPanelItem>
		);
	},
};

function BlockAttributeToolsPanelItem( {
	clientId,
	control,
	blockType,
	attributeValues,
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const ControlComponent = controls[ control.type ];

	if ( ! ControlComponent ) {
		return null;
	}

	return (
		<ControlComponent
			clientId={ clientId }
			control={ control }
			blockType={ blockType }
			attributeValues={ attributeValues }
			updateAttributes={ ( attributes ) =>
				updateBlockAttributes( clientId, attributes )
			}
		/>
	);
}

function BlockControls( { clientId } ) {
	const { attributes, blockType } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockName } =
				select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const blockName = getBlockName( clientId );
			return {
				attributes: getBlockAttributes( clientId ),
				blockType: getBlockType( blockName ),
			};
		},
		[ clientId ]
	);

	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );

	if ( ! blockType?.controls?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no controls.
		// for example, a way to select the block.
		return null;
	}

	return (
		<ToolsPanel
			label={
				<HStack spacing={ 1 }>
					<BlockIcon icon={ blockInformation?.icon } />
					<div>{ blockTitle }</div>
				</HStack>
			}
			panelId={ clientId }
		>
			{ blockType?.controls?.map( ( control, index ) => (
				<BlockAttributeToolsPanelItem
					key={ `${ clientId }/${ index }` }
					clientId={ clientId }
					control={ control }
					blockType={ blockType }
					attributeValues={ attributes }
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
