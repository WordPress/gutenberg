/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
// @ts-ignore
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import type { Action } from '@wordpress/dataviews';
import type { StoreDescriptor } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	isTemplateRemovable,
	getItemTitle,
	isTemplateOrTemplatePart,
} from './utils';
// @ts-ignore
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { Post } from '../types';

const { PATTERN_TYPES } = unlock( patternsPrivateApis );

// This action is used for templates, patterns and template parts.
// Every other post type uses the similar `trashPostAction` which
// moves the post to trash.
const deletePostAction: Action< Post > = {
	id: 'delete-post',
	label: __( 'Delete' ),
	isPrimary: true,
	icon: trash,
	isEligible( post ) {
		if ( isTemplateOrTemplatePart( post ) ) {
			return isTemplateRemovable( post );
		}
		// We can only remove user patterns.
		return post.type === PATTERN_TYPES.user;
	},
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const [ isBusy, setIsBusy ] = useState( false );
		const { removeTemplates } = unlock(
			useDispatch( editorStore as StoreDescriptor )
		);
		return (
			<VStack spacing="5">
				<Text>
					{ items.length > 1
						? sprintf(
								// translators: %d: number of items to delete.
								_n(
									'Delete %d item?',
									'Delete %d items?',
									items.length
								),
								items.length
						  )
						: sprintf(
								// translators: %s: The template or template part's titles
								__( 'Delete "%s"?' ),
								getItemTitle( items[ 0 ] )
						  ) }
				</Text>
				<HStack justify="right">
					<Button
						variant="tertiary"
						onClick={ closeModal }
						disabled={ isBusy }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							setIsBusy( true );
							await removeTemplates( items, {
								allowUndo: false,
							} );
							onActionPerformed?.( items );
							setIsBusy( false );
							closeModal?.();
						} }
						isBusy={ isBusy }
						disabled={ isBusy }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export default deletePostAction;
