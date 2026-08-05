/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

export default function RevisionsView() {
	const { lastRevisionId, revisionsCount, disableVisualRevisions } =
		useSelect( ( select ) => {
			const {
				getCurrentPostLastRevisionId,
				getCurrentPostRevisionsCount,
				getEditorSettings,
			} = select( editorStore );
			return {
				lastRevisionId: getCurrentPostLastRevisionId(),
				revisionsCount: getCurrentPostRevisionsCount(),
				disableVisualRevisions:
					// @ts-expect-error Editor settings are typed as a bare `Object`.
					!! getEditorSettings().disableVisualRevisions,
			};
		}, [] );
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	const buttonProps = disableVisualRevisions
		? {
				href: addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
				} ),
		  }
		: { onClick: () => setCurrentRevisionId( lastRevisionId ) };

	return (
		<Button
			{ ...buttonProps }
			variant="link"
			text={ String( revisionsCount ) }
			aria-label={ sprintf(
				/* translators: %d: number of revisions. */
				_n(
					'Open revisions screen: %d revision',
					'Open revisions screen: %d revisions',
					revisionsCount
				),
				revisionsCount
			) }
		/>
	);
}
