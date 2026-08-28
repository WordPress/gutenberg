import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

export default function RevisionsView() {
	const { lastRevisionId, revisionsCount } = useSelect( ( select ) => {
		const { getCurrentPostLastRevisionId, getCurrentPostRevisionsCount } =
			select( editorStore );
		return {
			lastRevisionId: getCurrentPostLastRevisionId(),
			revisionsCount: getCurrentPostRevisionsCount(),
		};
	}, [] );
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );

	return (
		<Button
			onClick={ () => setCurrentRevisionId( lastRevisionId ) }
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
