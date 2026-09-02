import { trash } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalText as WCText,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import type { Action } from '@wordpress/dataviews';
import { getItemTitle } from './utils';
import { canTrash, trashItems } from './trash-items';
import type { PostWithPermissions } from '../types';

const trashPost: Action< PostWithPermissions > = {
	id: 'move-to-trash',
	label: _x( 'Trash…', 'verb' ),
	modalHeader: _x( 'Trash', 'verb' ),
	icon: trash,
	// Drafts are trashed by the `trashDraft` quick action, which does not
	// ask for confirmation.
	isEligible( item ) {
		return item.status !== 'draft' && canTrash( item );
	},
	supportsBulk: true,
	hideModalHeader: true,
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const registry = useRegistry();
		return (
			<VStack spacing="5">
				<WCText>
					{ items.length === 1
						? sprintf(
								// translators: %s: The item's title.
								__(
									'Are you sure you want to move "%s" to the trash?'
								),
								getItemTitle( items[ 0 ] )
						  )
						: sprintf(
								// translators: %d: The number of items (2 or more).
								_n(
									'Are you sure you want to move %d item to the trash ?',
									'Are you sure you want to move %d items to the trash ?',
									items.length
								),
								items.length
						  ) }
				</WCText>
				<HStack justify="right">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							await trashItems( items, {
								registry,
								onActionPerformed,
							} );
							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
					>
						{ _x( 'Trash', 'verb' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

/**
 * Trash action for PostWithPermissions.
 */
export default trashPost;
