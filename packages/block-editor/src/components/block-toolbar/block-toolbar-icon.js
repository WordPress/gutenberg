/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { copy, symbol } from '@wordpress/icons';
import { getBlockType, store as blocksStore } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import BlockSwitcher from '../block-switcher';
import BlockIcon from '../block-icon';
import PatternOverridesDropdown from './pattern-overrides-dropdown';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { store as blockEditorStore } from '../../store';
import { hasPatternOverridesDefaultBinding } from '../../utils/block-bindings';
import { unlock } from '../../lock-unlock';

function getBlockIconVariant( { select, clientIds } ) {
	const {
		getBlockName,
		getBlockAttributes,
		getBlockParentsByBlockName,
		canRemoveBlocks,
		getTemplateLock,
		getBlockEditingMode,
	} = unlock( select( blockEditorStore ) );
	const { getBlockStyles } = select( blocksStore );

	const hasTemplateLock = clientIds.some(
		( id ) => getTemplateLock( id ) === 'contentOnly'
	);

	// Calculate props only used in this function
	const isSingleBlock = clientIds.length === 1;
	const blockName = isSingleBlock && getBlockName( clientIds[ 0 ] );
	const hasBlockStyles =
		isSingleBlock && !! getBlockStyles( blockName )?.length;
	const hasPatternNameInSelection = clientIds.some(
		( id ) => !! getBlockAttributes( id )?.metadata?.patternName
	);
	const hasPatternOverrides = clientIds.every( ( clientId ) =>
		hasPatternOverridesDefaultBinding(
			getBlockAttributes( clientId )?.metadata?.bindings
		)
	);
	const hasParentPattern = clientIds.every(
		( clientId ) =>
			getBlockParentsByBlockName( clientId, 'core/block', true ).length >
			0
	);
	const canRemove = canRemoveBlocks( clientIds );

	const isDefaultEditingMode =
		getBlockEditingMode( clientIds[ 0 ] ) === 'default';
	const _hideTransformsForSections =
		window?.__experimentalContentOnlyPatternInsertion &&
		hasPatternNameInSelection;
	const _showBlockSwitcher =
		! _hideTransformsForSections &&
		isDefaultEditingMode &&
		( hasBlockStyles || canRemove ) &&
		! hasTemplateLock;

	const _showPatternOverrides = hasPatternOverrides && hasParentPattern;

	if ( _showBlockSwitcher ) {
		return 'switcher';
	} else if ( _showPatternOverrides ) {
		return 'pattern-overrides';
	}

	return 'default';
}

function getBlockIcon( { select, clientIds } ) {
	const { getBlockName, getBlockAttributes } = unlock(
		select( blockEditorStore )
	);

	const _isSingleBlock = clientIds.length === 1;
	const firstClientId = clientIds[ 0 ];
	const blockAttributes = getBlockAttributes( firstClientId );
	if (
		_isSingleBlock &&
		blockAttributes?.metadata?.patternName &&
		window?.__experimentalContentOnlyPatternInsertion
	) {
		return symbol;
	}

	const blockName = getBlockName( firstClientId );
	const blockType = getBlockType( blockName );

	if ( _isSingleBlock ) {
		const { getActiveBlockVariation } = select( blocksStore );
		const match = getActiveBlockVariation( blockName, blockAttributes );
		return match?.icon || blockType?.icon;
	}

	const blockNames = clientIds.map( ( id ) => getBlockName( id ) );
	const isSelectionOfSameType = new Set( blockNames ).size === 1;
	return isSelectionOfSameType ? blockType?.icon : copy;
}

export default function BlockToolbarIcon( { clientIds, isSynced } ) {
	const { icon, showIconLabels, variant } = useSelect(
		( select ) => {
			return {
				icon: getBlockIcon( { select, clientIds } ),
				showIconLabels: select( preferencesStore ).get(
					'core',
					'showIconLabels'
				),
				variant: getBlockIconVariant( {
					select,
					clientIds,
				} ),
			};
		},
		[ clientIds ]
	);

	const blockTitle = useBlockDisplayTitle( {
		clientId: clientIds?.[ 0 ],
		maximumLength: 35,
	} );

	const isSingleBlock = clientIds.length === 1;
	const showBlockTitle = isSingleBlock && isSynced && ! showIconLabels;
	const label = isSingleBlock ? blockTitle : __( 'Multiple blocks selected' );
	// Used to hide the block icon when the showIconLabels preference is enabled, or to display the template title when it's a template.
	const text = showBlockTitle && blockTitle ? blockTitle : undefined;

	const BlockIconElement = (
		<BlockIcon
			className="block-editor-block-toolbar__block-icon"
			icon={ icon }
		/>
	);

	if ( variant === 'switcher' ) {
		return (
			<BlockSwitcher
				clientIds={ clientIds }
				label={ label }
				text={ text }
			>
				{ BlockIconElement }
			</BlockSwitcher>
		);
	}

	if ( variant === 'pattern-overrides' ) {
		return (
			<PatternOverridesDropdown
				icon={ BlockIconElement }
				clientIds={ clientIds }
				blockTitle={ blockTitle }
				label={ label }
			/>
		);
	}

	return (
		<ToolbarButton
			disabled
			className="block-editor-block-toolbar__block-icon-button"
			title={ label }
			icon={ BlockIconElement }
			text={ text }
		/>
	);
}
