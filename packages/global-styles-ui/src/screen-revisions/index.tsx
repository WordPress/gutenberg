import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	useNavigator,
} from '@wordpress/components';
import { useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { areGlobalStylesEqual } from '@wordpress/global-styles-engine';
import type { View } from '@wordpress/dataviews';
import { ScreenHeader } from '../screen-header';
import { GlobalStylesContext } from '../context';
import useGlobalStylesRevisions from './use-global-styles-revisions';
import RevisionsList from './revisions-list';

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

	const onCloseRevisions = () => {
		if ( onClose ) {
			onClose();
		}
	};

	const restoreRevision = ( revision: any ) => {
		setUserConfig( revision );
		setIsLoadingRevisionWithUnsavedChanges( false );
		onCloseRevisions();
	};

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
			// item again emits an empty selection (clicks bubbling up from the
			// Apply button included). Keep the current revision selected in
			// that case so the timeline never ends up with nothing selected.
			if ( ! newSelection.length ) {
				return;
			}
			goTo( `/revisions/${ newSelection[ newSelection.length - 1 ] }` );
		},
		[ goTo ]
	);

	// Only display load button if there is a revision to load,
	// and it is different from the current editor styles.
	const isLoadButtonEnabled =
		!! currentlySelectedRevisionId &&
		currentlySelectedRevisionId !== 'unsaved' &&
		! selectedRevisionMatchesEditorStyles;

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
				onApplyRevision={ () =>
					hasUnsavedChanges
						? setIsLoadingRevisionWithUnsavedChanges( true )
						: restoreRevision( currentlySelectedRevision )
				}
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
