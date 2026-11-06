import { getBlockSupport } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { normalizeLegacyLayout } from '../../layouts/utils';
import type { Layout, LayoutBlockSupport } from '../../layouts/types';
import { isPlainObject } from '../../utils/object';
import type { OnBlocksDrop } from '../use-on-block-drop/types';
import { getAutoGridItemStyleAfterDrop } from './auto-grid-drop';

/**
 * Provides auto-grid behavior to generic block drop hooks.
 *
 * @return Auto-grid drop behavior callbacks.
 */
export default function useAutoGridDrop() {
	const {
		getBlockAttributes,
		getBlockName,
		getBlockStyles,
		getSelectedBlockStyleState,
	} = unlock( useSelect( blockEditorStore ) );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const onBlocksDrop = useCallback< OnBlocksDrop >(
		( sourceClientIds, sourceRootClientId ) => {
			if ( ! sourceRootClientId ) {
				return;
			}

			const parentName = getBlockName( sourceRootClientId );
			const parentAttributes = getBlockAttributes( sourceRootClientId );
			const attributeLayout = isPlainObject( parentAttributes?.layout )
				? ( parentAttributes.layout as Layout )
				: undefined;
			const layoutSupport = ( parentName &&
				( getBlockSupport( parentName, 'layout' ) ||
					getBlockSupport(
						parentName,
						'__experimentalLayout'
					) ) ) as LayoutBlockSupport | undefined;
			const parentLayout =
				normalizeLegacyLayout( attributeLayout ) ||
				layoutSupport?.default;
			const blockStyles = getBlockStyles( sourceClientIds );
			const updates: Record< string, { style?: unknown } > = {};

			for ( const clientId of sourceClientIds ) {
				const result = getAutoGridItemStyleAfterDrop(
					parentLayout,
					blockStyles[ clientId ],
					getSelectedBlockStyleState( clientId )
				);
				if ( result.shouldReset ) {
					updates[ clientId ] = { style: result.style };
				}
			}

			const clientIdsToUpdate = Object.keys( updates );
			if ( ! clientIdsToUpdate.length ) {
				return;
			}

			updateBlockAttributes( clientIdsToUpdate, updates, {
				uniqueByBlock: true,
			} );
		},
		[
			getBlockAttributes,
			getBlockName,
			getBlockStyles,
			getSelectedBlockStyleState,
			updateBlockAttributes,
		]
	);

	return { onBlocksDrop };
}
