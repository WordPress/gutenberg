/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { MenuItem } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

export default function PostLastRevision() {
	const { revisionsCount, lastRevisionId } = useSelect(
		( select ) => ( {
			revisionsCount:
				select( editorStore ).getCurrentPostRevisionsCount(),
			lastRevisionId:
				select( editorStore ).getCurrentPostLastRevisionId(),
		} ),
		[]
	);

	return (
		<MenuItem
			icon={
				<RevisionsCountBadge>{ revisionsCount }</RevisionsCountBadge>
			}
			href={ addQueryArgs( 'revision.php', {
				revision: lastRevisionId,
				gutenberg: true,
			} ) }
		>
			{ __( 'Revision history' ) }
		</MenuItem>
	);
}

function RevisionsCountBadge( { className, children } ) {
	return (
		<span
			className={ classnames(
				className,
				'edit-post-post-status__revisions-count-badge'
			) }
		>
			{ children }
		</span>
	);
}
