/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { dateI18n, getDate, humanTimeDiff, getSettings } from '@wordpress/date';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { getGlobalStylesChanges } from '@wordpress/global-styles-engine';
import { DataViewsPicker } from '@wordpress/dataviews';
import type {
	ActionButton,
	Field,
	SupportedLayouts,
	View,
} from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { Revision } from './types';
import { unlock } from '../lock-unlock';

const { Badge: WCBadge } = unlock( componentsPrivateApis );

const DAY_IN_MILLISECONDS = 60 * 60 * 1000 * 24;
const DEFAULT_LAYOUTS: SupportedLayouts = { pickerActivity: true };

const getItemId = ( item: Revision ) => String( item.id );

function normalizeModified(
	modified: Revision[ 'modified' ]
): string | undefined {
	// Convert modified to string if it's a Date, for type compatibility.
	return modified instanceof Date ? modified.toISOString() : modified;
}

function getDisplayDate( modified: Revision[ 'modified' ] ): string {
	const modifiedString = normalizeModified( modified );
	const modifiedDate = getDate( modifiedString ?? null );
	const dateNowInMs = getDate( null ).getTime();
	return modifiedString &&
		dateNowInMs - modifiedDate.getTime() > DAY_IN_MILLISECONDS
		? dateI18n( getSettings().formats.datetimeAbbreviated, modifiedDate )
		: humanTimeDiff( modifiedString ?? modifiedDate, undefined );
}

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
 * Returns a label for the revision, also used as the option's accessible name.
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

interface RevisionsListProps {
	revisions: Revision[];
	view: View;
	onChangeView: ( view: View ) => void;
	selection: string[];
	onChangeSelection: ( selection: string[] ) => void;
	isLoading?: boolean;
	paginationInfo: { totalItems: number; totalPages: number };
	canApplyRevision?: boolean;
	actions?: ActionButton< Revision >[];
}

/**
 * Renders the revisions timeline using the DataViews picker activity layout.
 * @param root0
 * @param root0.revisions
 * @param root0.view
 * @param root0.onChangeView
 * @param root0.selection
 * @param root0.onChangeSelection
 * @param root0.isLoading
 * @param root0.paginationInfo
 * @param root0.canApplyRevision
 * @param root0.actions
 */
function RevisionsList( {
	revisions,
	view,
	onChangeView,
	selection,
	onChangeSelection,
	isLoading,
	paginationInfo,
	canApplyRevision,
	actions,
}: RevisionsListProps ) {
	const { currentThemeName, currentUser } = useSelect( ( select ) => {
		const { getCurrentTheme, getCurrentUser } = select( coreStore );
		const currentTheme = getCurrentTheme();
		return {
			currentThemeName:
				currentTheme?.name?.rendered || currentTheme?.stylesheet,
			currentUser: getCurrentUser(),
		};
	}, [] );

	const fields: Field< Revision >[] = useMemo( () => {
		const getAuthor = ( revision: Revision ) =>
			// Unsaved changes are created by the current user.
			'unsaved' === revision.id ? currentUser : revision.author;
		const getAuthorDisplayName = ( revision: Revision ) =>
			getAuthor( revision )?.name || __( 'User' );
		const isSelected = ( revision: Revision ) =>
			selection.includes( String( revision.id ) );

		return [
			{
				id: 'date',
				label: __( 'Date' ),
				// The value is used as the option's accessible name, so it
				// carries the full revision description rather than the
				// shorter date the row renders.
				getValue: ( { item } ) => {
					const formattedModifiedDate =
						'parent' === item.id || 'unsaved' === item.id
							? ''
							: dateI18n(
									getSettings().formats.datetimeAbbreviated,
									getDate(
										normalizeModified( item.modified ) ??
											null
									)
							  );
					return getRevisionLabel(
						item.id,
						getAuthorDisplayName( item ),
						formattedModifiedDate,
						! canApplyRevision && isSelected( item )
					);
				},
				render: ( { item } ) => {
					if ( 'parent' === item.id ) {
						return (
							<span className="global-styles-ui-screen-revisions__date">
								{ __( 'Default styles' ) }
							</span>
						);
					}
					if ( 'unsaved' === item.id ) {
						return (
							<span className="global-styles-ui-screen-revisions__date">
								{ __( '(Unsaved)' ) }
							</span>
						);
					}
					return (
						<time
							className="global-styles-ui-screen-revisions__date"
							dateTime={ normalizeModified( item.modified ) }
						>
							{ getDisplayDate( item.modified ) }
						</time>
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'details',
				label: __( 'Details' ),
				getValue: ( { item } ) =>
					'parent' === item.id
						? currentThemeName
						: getAuthorDisplayName( item ),
				render: ( { item } ) => {
					const authorDisplayName = getAuthorDisplayName( item );
					const isReset = 'parent' === item.id;
					// The reset entry shows the theme name in the meta slot.
					const meta = isReset ? (
						<span className="global-styles-ui-screen-revisions__meta">
							{ currentThemeName }
						</span>
					) : (
						<span className="global-styles-ui-screen-revisions__meta">
							<img
								alt={ authorDisplayName }
								src={ getAuthor( item )?.avatar_urls?.[ '48' ] }
							/>
							{ authorDisplayName }
						</span>
					);

					if ( ! isSelected( item ) ) {
						return (
							<span className="global-styles-ui-screen-revisions__description">
								{ meta }
							</span>
						);
					}

					// DataViews clones items, so the previous revision must be
					// resolved by id against the fetched page.
					const index = revisions.findIndex(
						( revision ) =>
							String( revision.id ) === String( item.id )
					);
					return (
						<span className="global-styles-ui-screen-revisions__description">
							{ meta }
							{ ! isReset && (
								<ChangesSummary
									revision={ revisions[ index ] ?? item }
									previousRevision={
										index >= 0
											? revisions[ index + 1 ]
											: undefined
									}
								/>
							) }
							{ ! canApplyRevision && (
								<WCBadge
									className="global-styles-ui-screen-revisions__active-badge"
									intent="info"
								>
									{ __( 'Active' ) }
								</WCBadge>
							) }
						</span>
					);
				},
				enableSorting: false,
				enableHiding: false,
			},
		];
	}, [
		selection,
		canApplyRevision,
		currentUser,
		currentThemeName,
		revisions,
	] );

	return (
		<div className="global-styles-ui-screen-revisions">
			<DataViewsPicker
				view={ view }
				onChangeView={ onChangeView }
				fields={ fields }
				data={ revisions }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ getItemId }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				itemListLabel={ __( 'Global styles revisions list' ) }
				actions={ actions }
			>
				<DataViewsPicker.Layout />
				<DataViewsPicker.Footer />
			</DataViewsPicker>
		</div>
	);
}

export default RevisionsList;
