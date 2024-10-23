/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

export default function TemplatePartContentPanel( { clientId } ) {
	const { descendentBlockIds, descendentBlockNames, blockTypes } = useSelect(
		( select ) => {
			const { getClientIdsOfDescendants, getBlockNamesByClientId } =
				select( blockEditorStore );
			const { getBlockTypes } = select( blocksStore );
			const _descendentBlockIds = getClientIdsOfDescendants( clientId );
			return {
				descendentBlockIds: _descendentBlockIds,
				descendentBlockNames:
					getBlockNamesByClientId( _descendentBlockIds ),
				blockTypes: getBlockTypes(),
			};
		},
		[ clientId ]
	);
	const themeBlocks = useMemo( () => {
		const themeBlockNames = blockTypes
			.filter( ( blockType ) => {
				return blockType.category === 'theme';
			} )
			.map( ( { name } ) => name );
		return descendentBlockIds.filter( ( _, index ) => {
			return themeBlockNames.includes( descendentBlockNames[ index ] );
		} );
	}, [ descendentBlockIds, descendentBlockNames, blockTypes ] );
	if ( themeBlocks.length === 0 ) {
		return null;
	}
	return (
		<PanelBody title={ __( 'Content' ) }>
			<BlockQuickNavigation clientIds={ themeBlocks } />
		</PanelBody>
	);
}
