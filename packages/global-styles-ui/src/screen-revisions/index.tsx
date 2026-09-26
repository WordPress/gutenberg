import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	useNavigator,
} from '@wordpress/components';
import { useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { areGlobalStylesEqual } from '@wordpress/global-styles-engine';
import type { ActionButton, View } from '@wordpress/dataviews';
import { ScreenHeader } from '../screen-header';
import { GlobalStylesContext } from '../context';
import useGlobalStylesRevisions from './use-global-styles-revisions';
import RevisionsList from './revisions-list';
import type { Revision } from './types';

const PAGE_SIZE = 10;
const EMPTY_ARRAY: string[] = [];

const DEFAULT_VIEW: View = {
	type: 'pickerActivity',
	titleField: 'date',
	descriptionField: 'details',
	layout: { density: 'compact' },
	page: 1,
	perPage: PAGE_SIZE,
};

function ScreenRevisions() {
	const { user: currentEditorGlobalStyles, onChange: setUserConfig } =
		useContext( GlobalStylesContext );
	const { params, goTo } = useNavigator();
	const { revisionId } = params;
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const query = useMemo(
		() => ( {
			per_page: view.perPage ?? PAGE_SIZE,
			page: view.page ?? 1,
		} ),
		[ view.perPage, view.page ]
	);
	const { revisions, isLoading, hasUnsavedChanges, revisionsCount } =
		useGlobalStylesRevisions( { query } );

	const paginationInfo = useMemo(
		() => ( {
			totalItems: revisionsCount,
			totalPages: Math.ceil( revisionsCount / query.per_page ),
		} ),
		[ revisionsCount, query.per_page ]
	);

	const [
		isLoadingRevisionWithUnsavedChanges,
		setIsLoadingRevisionWithUnsavedChanges,
	] = useState( false );

	// The screen holds a single page of revisions, so the revision the path
	// names is selected only while this page carries it. Paginating away from
	// it selects nothing, rather than a stand-in the user never picked. With
	// no revision in the path, the active entry is selected.
	const currentlySelectedRevision = useMemo( () => {
		if ( revisionId ) {
			return revisions.find(
				( revision ) => String( revision.id ) === String( revisionId )
			);
		}
		return query.page === 1 ? revisions[ 0 ] : undefined;
	}, [ revisionId, revisions, query.page ] );

	// The entry for the styles the editor shows is the first one of page one:
	// the unsaved changes when there are any, else the latest revision.
	const activeRevisionId = query.page === 1 ? revisions[ 0 ]?.id : undefined;

	// A revision is applicable when it isn't the styles the editor already
	// shows. The footer action's eligibility and the list's Active badge both
	// read this, so the button and the badge can't contradict each other. The
	// active entry is recognised by id as well as by payload, as the two
	// endpoints need not serialize the same styles identically.
	const isRevisionApplicable = useCallback(
		( revision: Revision ) =>
			'unsaved' !== revision.id &&
			revision.id !== activeRevisionId &&
			! areGlobalStylesEqual( revision, currentEditorGlobalStyles ),
		[ activeRevisionId, currentEditorGlobalStyles ]
	);

	const isSelectedRevisionApplicable =
		!! currentlySelectedRevision &&
		isRevisionApplicable( currentlySelectedRevision );

	// Both the back arrow and Apply leave the revisions screen. Selecting a
	// revision appends its id to the path (`/revisions/12`), so the navigator's
	// default back action would only strip the id and leave the user on the
	// same screen. Go straight to the root screen instead.
	const closeRevisions = useCallback( () => {
		goTo( '/', { isBack: true } );
	}, [ goTo ] );

	const restoreRevision = useCallback(
		( revision?: Revision ) => {
			// The confirmation dialog can outlive its revision: the page
			// reloads or changes underneath it, and the selection is gone by
			// the time the user confirms. Close the dialog and apply nothing.
			setIsLoadingRevisionWithUnsavedChanges( false );
			if ( ! revision ) {
				return;
			}
			setUserConfig( revision );
			closeRevisions();
		},
		[ setUserConfig, closeRevisions ]
	);

	const currentlySelectedRevisionId = currentlySelectedRevision?.id;

	const selection = useMemo(
		() =>
			currentlySelectedRevisionId !== undefined
				? [ String( currentlySelectedRevisionId ) ]
				: EMPTY_ARRAY,
		[ currentlySelectedRevisionId ]
	);

	const onChangeSelection = useCallback(
		( newSelection: string[] ) => {
			// The picker's single selection is clearable: clicking the selected
			// item again emits an empty selection. Keep the current revision
			// selected in that case so the timeline never ends up with nothing
			// selected.
			if ( ! newSelection.length ) {
				return;
			}
			goTo( `/revisions/${ newSelection[ newSelection.length - 1 ] }` );
		},
		[ goTo ]
	);

	const onApplyRevision = useCallback( () => {
		if ( hasUnsavedChanges ) {
			setIsLoadingRevisionWithUnsavedChanges( true );
			return;
		}
		restoreRevision( currentlySelectedRevision );
	}, [ hasUnsavedChanges, restoreRevision, currentlySelectedRevision ] );

	// Apply / Reset to defaults render in the picker footer, outside the
	// timeline listbox, so the options hold no interactive content.
	const actions: ActionButton< Revision >[] = useMemo(
		() => [
			{
				id: 'apply-revision',
				label: ( items: Revision[] ) =>
					items[ 0 ]?.id === 'parent' ? __( 'Reset' ) : __( 'Apply' ),
				isPrimary: true,
				isEligible: isRevisionApplicable,
				callback: onApplyRevision,
			},
		],
		[ isRevisionApplicable, onApplyRevision ]
	);

	return (
		<>
			<ScreenHeader
				title={
					revisionsCount
						? sprintf(
								// translators: %d: number of revisions.
								__( 'Revisions (%d)' ),
								revisionsCount
							)
						: __( 'Revisions' )
				}
				description={ __(
					'Click on previously saved styles to preview them. To restore a selected version to the editor, hit "Apply." When you\'re ready, use the Save button to save your changes.'
				) }
				onBack={ closeRevisions }
			/>
			<RevisionsList
				revisions={ revisions }
				view={ view }
				onChangeView={ setView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				canApplyRevision={ isSelectedRevisionApplicable }
				actions={ actions }
			/>
			{ isLoadingRevisionWithUnsavedChanges && (
				<ConfirmDialog
					isOpen={ isLoadingRevisionWithUnsavedChanges }
					confirmButtonText={ __( 'Apply' ) }
					onConfirm={ () =>
						restoreRevision( currentlySelectedRevision )
					}
					onCancel={ () =>
						setIsLoadingRevisionWithUnsavedChanges( false )
					}
					size="medium"
				>
					{ __(
						'Are you sure you want to apply this revision? Any unsaved changes will be lost.'
					) }
				</ConfirmDialog>
			) }
		</>
	);
}

export default ScreenRevisions;
