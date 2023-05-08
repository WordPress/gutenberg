/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';

/**
 * Returns a button label for the revision.
 *
 * @param {Object} revision A revision object.
 * @return {string} Translated label.
 */
function getRevisionLabel( revision ) {
	const authorDisplayName = revision?.author?.name || __( 'User' );
	const isUnsaved = 'unsaved' === revision?.id;

	if ( isUnsaved ) {
		return sprintf(
			/* translators: %(name)s author display name */
			__( 'Unsaved changes by %(name)s' ),
			{
				name: authorDisplayName,
			}
		);
	}
	const formattedDate = dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( revision?.modified )
	);

	return revision?.isLatest
		? sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Changes saved by %(name)s on %(date)s (current)' ),
				{
					name: authorDisplayName,
					date: formattedDate,
				}
		  )
		: sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Changes saved by %(name)s on %(date)s' ),
				{
					name: authorDisplayName,
					date: formattedDate,
				}
		  );
}

/**
 * Returns a rendered list of revisions buttons.
 *
 * @typedef {Object} props
 * @property {Array<Object>} userRevisions     A collection of user revisions.
 * @property {number}        currentRevisionId Callback fired when the modal is closed or action cancelled.
 * @property {Function}      onChange          Callback fired when a revision is selected.
 *
 * @param    {props}         Component         props.
 * @return {JSX.Element} The modal component.
 */
function RevisionsButtons( { userRevisions, currentRevisionId, onChange } ) {
	return (
		<ol
			className="edit-site-global-styles-screen-revisions__revisions-list"
			aria-label={ __( 'Global styles revisions' ) }
			role="group"
		>
			{ userRevisions.map( ( revision ) => {
				const { id, author, isLatest, modified } = revision;
				const authorDisplayName = author?.name || __( 'User' );
				const authorAvatar = author?.avatar_urls?.[ '48' ];
				/*
				 * If the currentId hasn't been selected yet, the first revision is
				 * the current one so long as the API returns revisions in descending order.
				 */
				const isActive = !! currentRevisionId
					? id === currentRevisionId
					: isLatest;

				return (
					<li
						className={ classnames(
							'edit-site-global-styles-screen-revisions__revision-item',
							{
								'is-current': isActive,
							}
						) }
						key={ id }
					>
						<Button
							className="edit-site-global-styles-screen-revisions__revision-button"
							disabled={ isActive }
							onClick={ () => {
								onChange( revision );
							} }
							label={ getRevisionLabel( revision ) }
						>
							<span className="edit-site-global-styles-screen-revisions__description">
								<time dateTime={ modified }>
									{ humanTimeDiff( modified ) }
								</time>
								<span className="edit-site-global-styles-screen-revisions__meta">
									{ sprintf(
										/* translators: %(name)s author display name */
										__( 'Changes saved by %(name)s' ),
										{
											name: authorDisplayName,
										}
									) }

									<img
										alt={ author?.name }
										src={ authorAvatar }
									/>
								</span>
							</span>
						</Button>
					</li>
				);
			} ) }
		</ol>
	);
}

export default RevisionsButtons;
