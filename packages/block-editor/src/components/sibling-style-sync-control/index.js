/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import InspectorControls from '../inspector-controls';

/**
 * Renders a notice in the block inspector for inner blocks that participate in
 * sibling style sync. Shows whether styles are currently synced or unlinked,
 * and provides Unlink / Re-sync actions.
 *
 * Hidden when:
 *  - there are no siblings of the same type in the sync scope
 *  - the parent scope has disabled sync for this block type via syncDescendantStyles
 *
 * @param {Object} props
 * @param {string} props.clientId Client ID of the current block.
 * @param {string} props.name     Block name (e.g. 'core/accordion-heading').
 */
export function SiblingStyleSyncControl( { clientId, name } ) {
	const { siblings, isUnlinked, scopeClientId, isSyncEnabled } = useSelect(
		( select ) => {
			const privateStore = unlock( select( blockEditorStore ) );
			const scope =
				privateStore.__experimentalGetSiblingStyleSyncScopeClientId(
					clientId,
					name
				);
			const syncDescendantStyles =
				scope !== null
					? select( blockEditorStore ).getBlockAttributes( scope )
							?.syncDescendantStyles ?? {}
					: {};

			return {
				siblings: privateStore.__experimentalGetSiblingStyleSyncBlocks(
					clientId,
					name
				),
				isUnlinked: privateStore.__experimentalIsBlockStyleSyncUnlinked(
					clientId,
					name
				),
				scopeClientId: scope,
				isSyncEnabled: syncDescendantStyles[ name ] !== false,
			};
		},
		[ clientId, name ]
	);

	const dispatch = useDispatch( blockEditorStore );

	if ( siblings.length === 0 || ! isSyncEnabled ) {
		return null;
	}

	const privateDispatch = unlock( dispatch );
	const blockTitle = getBlockType( name )?.title ?? name;
	const count = siblings.length;
	const label = sprintf(
		/* translators: 1: number of sibling blocks, 2: block type name */
		_n( '%1$d other %2$s block', '%1$d other %2$s blocks', count ),
		count,
		blockTitle
	);

	return (
		<InspectorControls group="styles">
			{ isUnlinked ? (
				<Notice status="warning" isDismissible={ false }>
					{ sprintf(
						/* translators: %s: description of sibling blocks e.g. "3 other Accordion Heading blocks" */
						__( 'Styles are unlinked from %s.' ),
						label
					) }{ ' ' }
					<Button
						variant="link"
						onClick={ () =>
							privateDispatch.__experimentalRelinkBlockStyleSync(
								clientId,
								name,
								scopeClientId
							)
						}
					>
						{ __( 'Re-copy styles' ) }
					</Button>
				</Notice>
			) : (
				<Notice status="info" isDismissible={ false }>
					{ sprintf(
						/* translators: %s: description of sibling blocks e.g. "3 other Accordion Heading blocks" */
						__( 'Styles copied to %s.' ),
						label
					) }{ ' ' }
					<Button
						variant="link"
						onClick={ () =>
							privateDispatch.__experimentalUnlinkBlockStyleSync(
								clientId,
								name,
								scopeClientId
							)
						}
					>
						{ __( 'Unlink this block' ) }
					</Button>
				</Notice>
			) }
		</InspectorControls>
	);
}
