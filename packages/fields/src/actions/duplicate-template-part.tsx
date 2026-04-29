/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';
// @ts-ignore
import { parse } from '@wordpress/blocks';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { Post, TemplatePart } from '../types';
import { CreateTemplatePartModalContents } from '../components/create-template-part-modal';
import { getItemTitle } from './utils';

/**
 * This action is used to duplicate a template part.
 */
const duplicateTemplatePart: Action< TemplatePart > = {
	id: 'duplicate-template-part',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type === 'wp_template_part',
	modalHeader: _x( 'Duplicate template part', 'action label' ),
	modalFocusOnMount: 'firstContentElement',
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const blocks = useMemo( () => {
			return (
				item.blocks ??
				parse(
					typeof item.content === 'string'
						? item.content
						: item.content.raw,
					{
						__unstableSkipMigrationLogs: true,
					}
				)
			);
		}, [ item.content, item.blocks ] );
		const { createSuccessNotice } = useDispatch( noticesStore );
		function onTemplatePartSuccess( templatePart: Post ) {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					_x( '"%s" duplicated.', 'template part' ),
					getItemTitle( templatePart )
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
			closeModal?.();
		}
		return (
			<CreateTemplatePartModalContents
				blocks={ blocks }
				defaultArea={ item.area }
				defaultTitle={ sprintf(
					/* translators: %s: Existing template part title */
					_x( '%s (Copy)', 'template part' ),
					getItemTitle( item )
				) }
				onCreate={ onTemplatePartSuccess }
				onError={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
				closeModal={ closeModal ?? ( () => {} ) }
			/>
		);
	},
};
/**
 * Duplicate action for TemplatePart.
 */
export default duplicateTemplatePart;
