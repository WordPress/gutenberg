import { useDispatch } from '@wordpress/data';
import { _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
// @ts-expect-error `@wordpress/patterns` is not typed yet.
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';
import type { Post, TemplatePart, ActionScriptParts } from '../../shared/types';
import { getItemTitle } from '../../shared/utils';

// Patterns.
const { CreateTemplatePartModalContents } = unlock( patternsPrivateApis );

/**
 * This action is used to duplicate a template part.
 */
const duplicateTemplatePart: ActionScriptParts< TemplatePart > = {
	isEligible: ( item ) => item.type === 'wp_template_part',
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
 * The JavaScript parts of the duplicate action for TemplatePart; its data is in
 * `action.php`.
 */
export default duplicateTemplatePart;
