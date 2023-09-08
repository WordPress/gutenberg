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
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Returns a button label for the revision.
 *
 * @param {Object} revision A revision object.
 * @return {string} Translated label.
 */
function getRevisionLabel( revision ) {
	const authorDisplayName = revision?.author?.name || __( 'User' );

	if ( 'parent' === revision?.id ) {
		return __( 'Reset the styles to the theme defaults' );
	}

	if ( 'unsaved' === revision?.id ) {
		return sprintf(
			/* translators: %s author display name */
			__( 'Unsaved changes by %s' ),
			authorDisplayName
		);
	}

	const formattedDate = dateI18n(
		getSettings().formats.datetimeAbbreviated,
		getDate( revision?.modified )
	);

	return revision?.isLatest
		? sprintf(
				/* translators: %1$s author display name, %2$s: revision creation date */
				__( 'Changes saved by %1$s on %2$s (current)' ),
				authorDisplayName,
				formattedDate
		  )
		: sprintf(
				/* translators: %1$s author display name, %2$s: revision creation date */
				__( 'Changes saved by %1$s on %2$s' ),
				authorDisplayName,
				formattedDate
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
	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme(),
		[]
	);
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
				const isReset = 'parent' === revision?.id;

				return (
					<li
						className={ classnames(
							'edit-site-global-styles-screen-revisions__revision-item',
							{
								'is-selected': isSelected,
								'is-reset': isReset,
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
							{ isReset ? (
								<span className="edit-site-global-styles-screen-revisions__description">
									{ __( 'Default styles' ) }
									<span className="edit-site-global-styles-screen-revisions__meta">
										{ currentTheme?.name?.rendered ||
											currentTheme?.stylesheet }
									</span>
								</span>
							) : (
								<span className="edit-site-global-styles-screen-revisions__description">
									<time dateTime={ modified }>
										{ humanTimeDiff( modified ) }
									</time>
									<span className="edit-site-global-styles-screen-revisions__meta">
										{ isUnsaved
											? sprintf(
													/* translators: %s author display name */
													__(
														'Unsaved changes by %s'
													),
													authorDisplayName
											  )
											: sprintf(
													/* translators: %s author display name */
													__( 'Changes saved by %s' ),
													authorDisplayName
											  ) }

										<img
											alt={ author?.name }
											src={ authorAvatar }
										/>
									</span>
								</span>
							) }
						</Button>
					</li>
				);
			} ) }
		</ol>
	);
}

export default RevisionsButtons;
