/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import getRevisionChanges from './get-revision-changes';

const DAY_IN_MILLISECONDS = 60 * 60 * 1000 * 24;
const MAX_CHANGES = 7;

function ChangesSummary( { revision, previousRevision, blockNames } ) {
	const changes = getRevisionChanges(
		revision,
		previousRevision,
		blockNames
	);
	const changesLength = changes.length;

	if ( ! changesLength ) {
		return null;
	}

	// Truncate to `n` results if necessary.
	if ( changesLength > MAX_CHANGES ) {
		const deleteCount = changesLength - MAX_CHANGES;
		const andMoreText = sprintf(
			// translators: %d: number of global styles changes that are not displayed in the UI.
			_n( '…and %d more change.', '…and %d more changes.', deleteCount ),
			deleteCount
		);
		changes.splice( MAX_CHANGES, deleteCount, andMoreText );
	}

	return (
		<span
			data-testid="global-styles-revision-changes"
			className="edit-site-global-styles-screen-revisions__changes"
		>
			{ changes.join( ', ' ) }
		</span>
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
	const blockNames = useMemo( () => {
		const blockTypes = getBlockTypes();
		return blockTypes.reduce( ( accumulator, { name, title } ) => {
			accumulator[ name ] = title;
			return accumulator;
		}, {} );
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
						className={ classnames(
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
							className="edit-site-global-styles-screen-revisions__revision-button"
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
											blockNames={ blockNames }
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
									disabled={ areStylesEqual }
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
