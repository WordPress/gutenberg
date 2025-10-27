/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import type { Revision } from './types';

const DAY_IN_MILLISECONDS = 60 * 60 * 1000 * 24;
const { getGlobalStylesChanges } = unlock( blockEditorPrivateApis );

interface ChangesSummaryProps {
	revision: Revision;
	previousRevision?: Revision;
}

function ChangesSummary( { revision, previousRevision }: ChangesSummaryProps ) {
	const changes: string[] = getGlobalStylesChanges(
		revision,
		previousRevision,
		{
			maxResults: 7,
		}
	);

	if ( ! changes.length ) {
		return null;
	}

	return (
		<ul
			data-testid="global-styles-revision-changes"
			className="global-styles-ui-screen-revisions__changes"
		>
			{ changes.map( ( change ) => (
				<li key={ change }>{ change }</li>
			) ) }
		</ul>
	);
}

/**
 * Returns a button label for the revision.
 * @param id
 * @param authorDisplayName
 * @param formattedModifiedDate
 * @param areStylesEqual
 */
function getRevisionLabel(
	id: string | number,
	authorDisplayName: string,
	formattedModifiedDate: string,
	areStylesEqual: boolean
): string {
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
				// translators: 1: author display name. 2: revision creation date.
				__(
					'Changes saved by %1$s on %2$s. This revision matches current editor styles.'
				),
				authorDisplayName,
				formattedModifiedDate
		  )
		: sprintf(
				// translators: 1: author display name. 2: revision creation date.
				__( 'Changes saved by %1$s on %2$s' ),
				authorDisplayName,
				formattedModifiedDate
		  );
}

interface RevisionButtonsProps {
	userRevisions: Revision[];
	selectedRevisionId?: string | number;
	onChange: ( revision: Revision ) => void;
	canApplyRevision?: boolean;
	onApplyRevision?: () => void;
}

/**
 * Returns a rendered list of revisions buttons.
 * @param root0
 * @param root0.userRevisions
 * @param root0.selectedRevisionId
 * @param root0.onChange
 * @param root0.canApplyRevision
 * @param root0.onApplyRevision
 */
function RevisionsButtons( {
	userRevisions,
	selectedRevisionId,
	onChange,
	canApplyRevision,
	onApplyRevision,
}: RevisionButtonsProps ) {
	const { currentThemeName, currentUser } = useSelect( ( select ) => {
		const { getCurrentTheme, getCurrentUser } = select( coreStore );
		const currentTheme = getCurrentTheme();
		return {
			currentThemeName:
				currentTheme?.name?.rendered || currentTheme?.stylesheet,
			currentUser: getCurrentUser(),
		};
	}, [] );
	const dateNowInMs = getDate( null ).getTime();
	const { datetimeAbbreviated } = getSettings().formats;

	return (
		<Composite
			orientation="vertical"
			className="global-styles-ui-screen-revisions__revisions-list"
			aria-label={ __( 'Global styles revisions list' ) }
			role="listbox"
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
				// Convert modified to string if it's a Date, for type compatibility
				const modifiedString =
					modified instanceof Date
						? modified.toISOString()
						: modified;
				const modifiedDate = getDate( modifiedString ?? null );
				const displayDate =
					modifiedString &&
					dateNowInMs - modifiedDate.getTime() > DAY_IN_MILLISECONDS
						? dateI18n( datetimeAbbreviated, modifiedDate )
						: humanTimeDiff(
								modifiedString ?? modifiedDate,
								undefined
						  );
				const revisionLabel = getRevisionLabel(
					id,
					authorDisplayName,
					dateI18n( datetimeAbbreviated, modifiedDate ),
					areStylesEqual
				);

				return (
					<Composite.Item
						key={ id }
						className="global-styles-ui-screen-revisions__revision-item"
						aria-current={ isSelected }
						role="option"
						onKeyDown={ ( event ) => {
							const { keyCode } = event;
							if ( keyCode === ENTER || keyCode === SPACE ) {
								onChange( revision );
							}
						} }
						onClick={ ( event ) => {
							event.preventDefault();
							onChange( revision );
						} }
						aria-selected={ isSelected }
						aria-label={ revisionLabel }
						render={ <div /> }
					>
						<span className="global-styles-ui-screen-revisions__revision-item-wrapper">
							{ isReset ? (
								<span className="global-styles-ui-screen-revisions__description">
									{ __( 'Default styles' ) }
									<span className="global-styles-ui-screen-revisions__meta">
										{ currentThemeName }
									</span>
								</span>
							) : (
								<span className="global-styles-ui-screen-revisions__description">
									{ isUnsaved ? (
										<span className="global-styles-ui-screen-revisions__date">
											{ __( '(Unsaved)' ) }
										</span>
									) : (
										<time
											className="global-styles-ui-screen-revisions__date"
											dateTime={ modifiedString }
										>
											{ displayDate }
										</time>
									) }
									<span className="global-styles-ui-screen-revisions__meta">
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
													: undefined
											}
										/>
									) }
								</span>
							) }
						</span>
						{ isSelected &&
							( areStylesEqual ? (
								<p className="global-styles-ui-screen-revisions__applied-text">
									{ __(
										'These styles are already applied to your site.'
									) }
								</p>
							) : (
								<Button
									size="compact"
									variant="primary"
									className="global-styles-ui-screen-revisions__apply-button"
									onClick={ onApplyRevision }
									aria-label={ __(
										'Apply the selected revision to your site.'
									) }
								>
									{ isReset
										? __( 'Reset to defaults' )
										: __( 'Apply' ) }
								</Button>
							) ) }
					</Composite.Item>
				);
			} ) }
		</Composite>
	);
}

export default RevisionsButtons;
