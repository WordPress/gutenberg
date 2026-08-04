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
	fields: [],
	layout: { density: 'compact' },
	page: 1,
	perPage: PAGE_SIZE,
};

interface ScreenRevisionsProps {
	onClose?: () => void;
}

function ScreenRevisions( { onClose }: ScreenRevisionsProps = {} ) {
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
			totalPages: Math.ceil(
				revisionsCount / ( view.perPage ?? PAGE_SIZE )
			),
		} ),
		[ revisionsCount, view.perPage ]
	);

	const [
		isLoadingRevisionWithUnsavedChanges,
		setIsLoadingRevisionWithUnsavedChanges,
	] = useState( false );

	// Derive the currently selected revision from the path parameter
	const currentlySelectedRevision = useMemo( () => {
		if ( ! revisionId ) {
			return currentEditorGlobalStyles;
		}
		const revision = revisions.find(
			( rev ) => String( rev.id ) === String( revisionId )
		);
		return revision || currentEditorGlobalStyles;
	}, [ revisionId, revisions, currentEditorGlobalStyles ] );

	const selectedRevisionMatchesEditorStyles = areGlobalStylesEqual(
		currentlySelectedRevision,
		currentEditorGlobalStyles
	);

	const onCloseRevisions = useCallback( () => {
		if ( onClose ) {
			onClose();
		}
	}, [ onClose ] );

	const restoreRevision = useCallback(
		( revision: any ) => {
			setUserConfig( revision );
			setIsLoadingRevisionWithUnsavedChanges( false );
			onCloseRevisions();
		},
		[ setUserConfig, onCloseRevisions ]
	);

	const currentlySelectedRevisionId =
		// @ts-expect-error: revision id is not present in the fallback (default object).
		currentlySelectedRevision?.id ?? revisions[ 0 ]?.id;

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

	// The selected revision is applicable when it exists and differs from
	// the current editor styles. Drives both the Active badge in the list
	// and the footer action's eligibility.
	const isLoadButtonEnabled =
		!! currentlySelectedRevisionId &&
		currentlySelectedRevisionId !== 'unsaved' &&
		! selectedRevisionMatchesEditorStyles;

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
					items[ 0 ]?.id === 'parent'
						? __( 'Reset to defaults' )
						: __( 'Apply' ),
				isPrimary: true,
				isEligible: ( item: Revision ) =>
					'unsaved' !== item.id &&
					! areGlobalStylesEqual( item, currentEditorGlobalStyles ),
				callback: onApplyRevision,
			},
		],
		[ currentEditorGlobalStyles, onApplyRevision ]
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
				onBack={ onCloseRevisions }
			/>
			<RevisionsList
				revisions={ revisions }
				view={ view }
				onChangeView={ setView }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				canApplyRevision={ isLoadButtonEnabled }
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
