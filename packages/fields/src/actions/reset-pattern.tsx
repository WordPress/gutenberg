import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { Button } from '@wordpress/components';
import { Text, Stack } from '@wordpress/ui';
import type { Action } from '@wordpress/dataviews';
import type { Pattern } from '../types';
import { getItemTitle } from './utils';

/**
 * Reverts an edited registered pattern to the registered version by trashing
 * the `wp_block` post that holds the edited copy.
 */
const resetPattern: Action< Pattern > = {
	id: 'reset-pattern',
	label: __( 'Reset' ),
	isEligible: ( item ) => item.type === 'pattern' && !! item.overrideId,
	supportsBulk: false,
	hideModalHeader: true,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ item ] = items;
		const { deleteEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );

		const onConfirm = async () => {
			try {
				await deleteEntityRecord(
					'postType',
					'wp_block',
					String( item.overrideId ),
					{},
					{ throwOnError: true }
				);
				createSuccessNotice(
					sprintf(
						/* translators: %s: The pattern's title. */
						__( '"%s" reset to the registered version.' ),
						getItemTitle( item )
					),
					{ type: 'snackbar', id: 'reset-pattern-action' }
				);
				onActionPerformed?.( items );
			} catch ( error ) {
				const message =
					typeof ( error as { message?: string } )?.message ===
					'string'
						? ( error as { message: string } ).message
						: __(
								'An error occurred while resetting the pattern.'
						  );
				createErrorNotice( message, { type: 'snackbar' } );
			}
			closeModal?.();
		};

		return (
			<Stack direction="column" gap="lg">
				<Text>
					{ sprintf(
						/* translators: %s: The pattern's title. */
						__(
							'Reset "%s" to the registered version? Your edits to it will be moved to the trash.'
						),
						getItemTitle( item )
					) }
				</Text>
				<Stack direction="row" justify="flex-end" gap="sm">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						__next40pxDefaultSize
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onConfirm }
						__next40pxDefaultSize
					>
						{ __( 'Reset' ) }
					</Button>
				</Stack>
			</Stack>
		);
	},
};

export default resetPattern;
