import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import {
	store as coreStore,
	privateApis as coreDataPrivateApis,
} from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { unlock } from '../../lock-unlock';

const { getTemplateInfo } = unlock( coreDataPrivateApis );

/**
 * Says that what is being described is defined by the template rather than by
 * the post, and offers to go and edit it.
 *
 * Renders nothing when there is no template to point at, or when the user
 * cannot edit it: there is nothing useful to say in either case.
 *
 * @return The rendered notice.
 */
export default function TemplateScopeNotice() {
	const { templateId, templateTitle, onNavigateToEntityRecord, canEdit } =
		useSelect( ( select ) => {
			const { getCurrentTemplateId, getEditorSettings } = select(
				editorStore
			) as {
				getCurrentTemplateId: () => string | undefined;
				getEditorSettings: () => {
					onNavigateToEntityRecord?: ( args: {
						postId: string;
						postType: string;
					} ) => void;
				};
			};
			const { canUser, getEntityRecord, getCurrentTheme } =
				select( coreStore );
			const currentTemplateId = getCurrentTemplateId();

			const template = currentTemplateId
				? getEntityRecord(
						'postType',
						TEMPLATE_POST_TYPE,
						currentTemplateId
					)
				: undefined;

			/*
			 * A template's own title is empty, or just its slug, until someone
			 * renames it. `getTemplateInfo` falls back to the name the theme
			 * gives it — "Pages", "Single Posts" — which is what the rest of
			 * the editor shows. It destructures the template, so it is only
			 * called once the record has actually loaded.
			 */
			const templateInfo = template
				? getTemplateInfo( {
						templateTypes:
							(
								getCurrentTheme() as
									| { default_template_types?: unknown[] }
									| undefined
							 )?.default_template_types ?? [],
						template,
					} )
				: undefined;

			return {
				templateId: currentTemplateId,
				templateTitle: templateInfo?.title as string | undefined,
				onNavigateToEntityRecord:
					getEditorSettings().onNavigateToEntityRecord,
				canEdit: !! canUser( 'create', {
					kind: 'postType',
					name: TEMPLATE_POST_TYPE,
				} ),
			};
		}, [] );

	if ( ! templateId || ! canEdit ) {
		return null;
	}

	const title = templateTitle ? decodeEntities( templateTitle ) : undefined;

	return (
		<Notice.Root intent="info" className="editor-template-scope-notice">
			<Notice.Title>
				{ __( 'This block comes from the template' ) }
			</Notice.Title>
			<Notice.Description>
				{ __(
					'Changes to its settings affect all posts and pages that use the template.'
				) }
			</Notice.Description>
			{ onNavigateToEntityRecord && (
				<Notice.Actions>
					<Notice.ActionButton
						variant="outline"
						onClick={ () =>
							onNavigateToEntityRecord( {
								postId: templateId,
								postType: TEMPLATE_POST_TYPE,
							} )
						}
					>
						{ /*
						 * A template that cannot be named is no reason to
						 * withhold the route to it.
						 */ }
						{ title
							? sprintf(
									// translators: %s: name of the template, e.g. "Pages".
									__( 'Edit %s template' ),
									title
								)
							: __( 'Edit template' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
