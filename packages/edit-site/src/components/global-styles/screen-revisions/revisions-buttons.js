/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const DAY_IN_MILLISECONDS = 60 * 60 * 1000 * 24;
const { getGlobalStylesChanges } = unlock( blockEditorPrivateApis );

function ChangesSummary( { revision, previousRevision } ) {
	const changes = getGlobalStylesChanges( revision, previousRevision, {
		maxResults: 7,
	} );

	if ( ! changes.length ) {
		return null;
	}

	return (
		<ul
			data-testid="global-styles-revision-changes"
			className="edit-site-global-styles-screen-revisions__changes"
		>
			{ changes.map( ( change ) => (
				<li key={ change }>{ change }</li>
			) ) }
		</ul>
	);
}

/**
 * Returns a button label for the revision.
 *
 * @param {string|number} id                    A revision object.
 * @param {string}        authorDisplayName     Author name.
 * @param {string}        formattedModifiedDate Revision modified date formatted.
 * @param {boolean}       areStylesEqual        Whether the revision matches the current editor styles.
 * @return {string} Translated label.
 */
function getRevisionLabel(
	id,
	authorDisplayName,
	formattedModifiedDate,
	areStylesEqual
) {
	if ( 'parent' === id ) {
		return __( 'Reset the styles to the theme defaults' );
	}

	if ( 'unsaved' === id ) {
		return sprintf(
			/* translators: %s: author display name */
			__( 'Unsaved changes by %s' ),
			authorDisplayName
		);
	}

	return areStylesEqual
		? sprintf(
				// translators: %1$s: author display name, %2$s: revision creation date.
				__(
					'Changes saved by %1$s on %2$s. This revision matches current editor styles.'
				),
				authorDisplayName,
				formattedModifiedDate
		  )
		: sprintf(
				// translators: %1$s: author display name, %2$s: revision creation date.
				__( 'Changes saved by %1$s on %2$s' ),
				authorDisplayName,
				formattedModifiedDate
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
function RevisionsButtons( {
	userRevisions,
	selectedRevisionId,
	onChange,
	canApplyRevision,
	onApplyRevision,
} ) {
	const { currentThemeName, currentUser } = useSelect( ( select ) => {
		const { getCurrentTheme, getCurrentUser } = select( coreStore );
		const currentTheme = getCurrentTheme();
		return {
			currentThemeName:
				currentTheme?.name?.rendered || currentTheme?.stylesheet,
			currentUser: getCurrentUser(),
		};
	}, [] );
	const dateNowInMs = getDate().getTime();
	const { datetimeAbbreviated } = getSettings().formats;

	return (
		<ol
			className="edit-site-global-styles-screen-revisions__revisions-list"
			aria-label={ __( 'Global styles revisions list' ) }
			role="group"
		>
			{ userRevisions.map( ( revision, index ) => {
				const { id, author, modified } = revision;
				const isUnsaved = 'unsaved' === id;
				// Unsaved changes are created by the current user.
				const revisionAuthor = isUnsaved ? currentUser : author;
				const authorDisplayName = revisionAuthor?.name || __( 'User' );
				const authorAvatar = revisionAuthor?.avatar_urls?.[ '48' ];
				const isFirstItem = index === 0;
				const isSelected = selectedRevisionId
					? selectedRevisionId === id
					: isFirstItem;
				const areStylesEqual = ! canApplyRevision && isSelected;
				const isReset = 'parent' === id;
				const modifiedDate = getDate( modified );
				const displayDate =
					modified &&
					dateNowInMs - modifiedDate.getTime() > DAY_IN_MILLISECONDS
						? dateI18n( datetimeAbbreviated, modifiedDate )
						: humanTimeDiff( modified );
				const revisionLabel = getRevisionLabel(
					id,
					authorDisplayName,
					dateI18n( datetimeAbbreviated, modifiedDate ),
					areStylesEqual
				);

				return (
					<li
						className={ clsx(
							'edit-site-global-styles-screen-revisions__revision-item',
							{
								'is-selected': isSelected,
								'is-active': areStylesEqual,
								'is-reset': isReset,
							}
						) }
						key={ id }
						aria-current={ isSelected }
					>
						<Button
							__next40pxDefaultSize
							className="edit-site-global-styles-screen-revisions__revision-button"
							accessibleWhenDisabled
							disabled={ isSelected }
							onClick={ () => {
								onChange( revision );
							} }
							aria-label={ revisionLabel }
						>
							{ isReset ? (
								<span className="edit-site-global-styles-screen-revisions__description">
									{ __( 'Default styles' ) }
									<span className="edit-site-global-styles-screen-revisions__meta">
										{ currentThemeName }
									</span>
								</span>
							) : (
								<span className="edit-site-global-styles-screen-revisions__description">
									{ isUnsaved ? (
										<span className="edit-site-global-styles-screen-revisions__date">
											{ __( '(Unsaved)' ) }
										</span>
									) : (
										<time
											className="edit-site-global-styles-screen-revisions__date"
											dateTime={ modified }
										>
											{ displayDate }
										</time>
									) }
									<span className="edit-site-global-styles-screen-revisions__meta">
										<img
											alt={ authorDisplayName }
											src={ authorAvatar }
										/>
										{ authorDisplayName }
									</span>
									{ isSelected && (
										<ChangesSummary
											revision={ revision }
											previousRevision={
												index < userRevisions.length
													? userRevisions[ index + 1 ]
													: {}
											}
										/>
									) }
								</span>
							) }
						</Button>
						{ isSelected &&
							( areStylesEqual ? (
								<p className="edit-site-global-styles-screen-revisions__applied-text">
									{ __(
										'These styles are already applied to your site.'
									) }
								</p>
							) : (
								<Button
									size="compact"
									variant="primary"
									className="edit-site-global-styles-screen-revisions__apply-button"
									onClick={ onApplyRevision }
								>
									{ isReset
										? __( 'Reset to defaults' )
										: __( 'Apply' ) }
								</Button>
							) ) }
					</li>
				);
			} ) }
		</ol>
	);
}

export default RevisionsButtons;
