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

	if ( 'unsaved' === revision?.id ) {
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
 * @property {Array<Object>} userRevisions      A collection of user revisions.
 * @property {number}        selectedRevisionId The id of the currently-selected revision.
 * @property {Function}      onChange           Callback fired when a revision is selected.
 *
 * @param    {props}         Component          props.
 * @return {JSX.Element} The modal component.
 */
function RevisionsButtons( { userRevisions, selectedRevisionId, onChange } ) {
	return (
		<ol
			className="edit-site-global-styles-screen-revisions__revisions-list"
			aria-label={ __( 'Global styles revisions' ) }
			role="group"
		>
			{ userRevisions.map( ( revision, index ) => {
				const { id, author, modified } = revision;
				const authorDisplayName = author?.name || __( 'User' );
				const authorAvatar = author?.avatar_urls?.[ '48' ];
				const isUnsaved = 'unsaved' === revision?.id;
				const isSelected = selectedRevisionId
					? selectedRevisionId === revision?.id
					: index === 0;

				return (
					<li
						className={ classnames(
							'edit-site-global-styles-screen-revisions__revision-item',
							{
								'is-selected': isSelected,
							}
						) }
						key={ id }
					>
						<Button
							className="edit-site-global-styles-screen-revisions__revision-button"
							disabled={ isSelected }
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
									{ isUnsaved
										? sprintf(
												/* translators: %(name)s author display name */
												__(
													'Unsaved changes by %(name)s'
												),
												{
													name: authorDisplayName,
												}
										  )
										: sprintf(
												/* translators: %(name)s author display name */
												__(
													'Changes saved by %(name)s'
												),
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
