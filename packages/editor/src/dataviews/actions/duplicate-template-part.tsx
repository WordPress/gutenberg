/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __, sprintf, _x } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';
// @ts-ignore
import { parse } from '@wordpress/blocks';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../../store/constants';
import { CreateTemplatePartModalContents } from '../../components/create-template-part-modal';
import { getItemTitle } from './utils';
import type { TemplatePart } from '../types';

const duplicateTemplatePart: Action< TemplatePart > = {
	id: 'duplicate-template-part',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type === TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate template part', 'action label' ),
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
		function onTemplatePartSuccess() {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					getItemTitle( item )
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
					__( '%s (Copy)' ),
					getItemTitle( item )
				) }
				onCreate={ onTemplatePartSuccess }
				onError={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
				closeModal={ closeModal }
			/>
		);
	},
};

export default duplicateTemplatePart;
