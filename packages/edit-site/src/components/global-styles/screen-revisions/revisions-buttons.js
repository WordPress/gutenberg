/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { dateI18n, getDate, humanTimeDiff } from '@wordpress/date';

/**
 * Returns a button label for the revision.
 *
 * @param {Object} revision A revision object.
 * @return {string} Translated label.
 */
function getRevisionLabel( revision ) {
	const authorDisplayName = revision?.author?.name;
	const isUnsaved = 'unsaved' === revision?.id;
	const isReset = 'parent' === revision?.id;

	if ( isReset ) {
		return __( 'Theme default styles' );
	}

	if ( isUnsaved ) {
		return sprintf(
			/* translators: %(name)s author display name */
			__( 'Unsaved changes by %(name)s' ),
			{
				name: authorDisplayName,
			}
		);
	}
	const date = getDate( revision?.modified );
	const formattedDate = dateI18n(
		// translators: a compact version of the revision's modified date.
		_x( 'j M @ H:i', 'formatted version of revision last modified date' ),
		date
	);

	return revision?.isLatest
		? sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Revision from %(date)s by %(name)s (current)' ),
				{
					name: authorDisplayName,
					date: formattedDate,
				}
		  )
		: sprintf(
				/* translators: %(name)s author display name, %(date)s: revision creation date */
				__( 'Revision from %(date)s by %(name)s ' ),
				{
					name: authorDisplayName,
					date: formattedDate,
				}
		  );
}

/**
 * Returns a title for the revision.
 *
 * @param {number|string} revisionId The id of a revision.
 * @return {string} Translated title.
 */
function getRevisionsTitle( revisionId ) {
	const isUnsaved = 'unsaved' === revisionId;
	const isReset = 'parent' === revisionId;

	if ( isReset ) {
		return __( 'Theme default styles' );
	}

	return isUnsaved ? __( 'Unsaved changes' ) : __( 'Changes saved' );
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
				const authorAvatar = author?.avatar_urls?.[ '24' ];
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
						key={ `user-styles-revision-${ id }` }
					>
						<Button
							className="edit-site-global-styles-screen-revisions__revision-button"
							disabled={ isActive }
							onClick={ () => {
								onChange( revision );
							} }
							aria-label={ getRevisionLabel( revision ) }
						>
							<span className="edit-site-global-styles-screen-revisions__description">
								<span>{ getRevisionsTitle( id ) }</span>
								{ ( !! modified || !! authorAvatar ) && (
									<span className="edit-site-global-styles-screen-revisions__meta">
										{ !! modified && (
											<time dateTime={ modified }>
												{ humanTimeDiff( modified ) }
											</time>
										) }
										{ !! authorAvatar && (
											<img
												alt={ author?.name }
												src={ authorAvatar }
											/>
										) }
									</span>
								) }
							</span>
						</Button>
					</li>
				);
			} ) }
		</ol>
	);
}

export default RevisionsButtons;
