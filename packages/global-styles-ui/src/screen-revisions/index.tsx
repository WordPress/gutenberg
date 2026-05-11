/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalConfirmDialog as ConfirmDialog,
	Spinner,
	useNavigator,
} from '@wordpress/components';
import { useContext, useState, useMemo } from '@wordpress/element';
import { areGlobalStylesEqual } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { ScreenHeader } from '../screen-header';
import { GlobalStylesContext } from '../context';
import useGlobalStylesRevisions from './use-global-styles-revisions';
import RevisionsButtons from './revisions-buttons';
import Pagination from '../pagination';

const PAGE_SIZE = 10;

interface ScreenRevisionsProps {
	onClose?: () => void;
}

function ScreenRevisions( { onClose }: ScreenRevisionsProps = {} ) {
	const { user: currentEditorGlobalStyles, onChange: setUserConfig } =
		useContext( GlobalStylesContext );
	const { params, goTo } = useNavigator();
	const { revisionId } = params;
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const { revisions, isLoading, hasUnsavedChanges, revisionsCount } =
		useGlobalStylesRevisions( {
			query: {
				per_page: PAGE_SIZE,
				page: currentPage,
			},
		} );

	const numPages = Math.ceil( revisionsCount / PAGE_SIZE );

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

	const handleRevisionSelect = ( revision: any ) => {
		goTo( `/revisions/${ revision.id }` );
	};

	const currentlySelectedRevisionId =
		// @ts-expect-error: revision id is not present in the fallback (default object).
		currentlySelectedRevision?.id ?? revisions[ 0 ]?.id;

	// Only display load button if there is a revision to load,
	// and it is different from the current editor styles.
	const isLoadButtonEnabled =
		!! currentlySelectedRevisionId &&
		currentlySelectedRevisionId !== 'unsaved' &&
		! selectedRevisionMatchesEditorStyles;
	const hasRevisions = !! revisions.length;

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
			{ ! hasRevisions && (
				<Spinner className="global-styles-ui-screen-revisions__loading" />
			) }
			<RevisionsButtons
				onChange={ handleRevisionSelect }
				selectedRevisionId={ currentlySelectedRevisionId }
				userRevisions={ revisions }
				canApplyRevision={ isLoadButtonEnabled }
				onApplyRevision={ () =>
					hasUnsavedChanges
						? setIsLoadingRevisionWithUnsavedChanges( true )
						: restoreRevision( currentlySelectedRevision )
				}
			/>
			{ numPages > 1 && (
				<div className="global-styles-ui-screen-revisions__footer">
					<Pagination
						className="global-styles-ui-screen-revisions__pagination"
						currentPage={ currentPage }
						numPages={ numPages }
						changePage={ setCurrentPage }
						totalItems={ revisionsCount }
						disabled={ isLoading }
						label={ __( 'Global Styles pagination' ) }
					/>
				</div>
			) }
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
