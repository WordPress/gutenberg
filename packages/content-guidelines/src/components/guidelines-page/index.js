/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import {
	Spinner,
	Notice,
	Button,
} from '@wordpress/components';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import LibraryPanel from '../library-panel';
import BlocksPanel from '../blocks-panel';
import PlaygroundPanel from '../playground';
import HistoryPanel from '../history';
import ImportExportPanel from '../import-export';
import EmptyState from '../guidelines-screen/empty-state';
import './style.scss';

/**
 * Header actions component with status notice.
 *
 * @param {Object}   props               Component props.
 * @param {boolean}  props.hasDraft      Whether there are draft changes.
 * @param {boolean}  props.isSaving      Whether currently saving.
 * @param {boolean}  props.isPublishing  Whether currently publishing.
 * @param {string}   props.error         Error message if any.
 * @param {Function} props.onClearError  Callback to clear error.
 * @param {Function} props.onShowHistory Callback to show history.
 * @return {JSX.Element} Header actions.
 */
function HeaderActions( { hasDraft, isSaving, isPublishing, error, onClearError, onShowHistory } ) {
	const { saveDraft, publishGuidelines, discardDraft } =
		useDispatch( STORE_NAME );

	return (
		<div className="guidelines-page__header-actions">
			<div className="guidelines-page__header-status">
				{ error && (
					<Notice
						status="error"
						isDismissible
						onDismiss={ onClearError }
						className="guidelines-page__header-notice"
					>
						{ error }
					</Notice>
				) }
				{ hasDraft && ! error && (
					<span className="guidelines-page__draft-indicator">
						{ __( 'Draft changes not published', 'content-guidelines' ) }
					</span>
				) }
			</div>
			<div className="guidelines-page__header-buttons">
				<Button
					icon={ backup }
					label={ __( 'History', 'content-guidelines' ) }
					onClick={ onShowHistory }
				/>
				{ hasDraft && (
					<>
						<Button
							variant="tertiary"
							onClick={ discardDraft }
							disabled={ isSaving || isPublishing }
						>
							{ __( 'Discard', 'content-guidelines' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ saveDraft }
							isBusy={ isSaving }
							disabled={ isSaving || isPublishing }
						>
							{ __( 'Save draft', 'content-guidelines' ) }
						</Button>
					</>
				) }
				<Button
					variant="primary"
					onClick={ publishGuidelines }
					isBusy={ isPublishing }
					disabled={ isSaving || isPublishing || ! hasDraft }
				>
					{ __( 'Publish', 'content-guidelines' ) }
				</Button>
			</div>
		</div>
	);
}

/**
 * Get URL params for navigation state.
 *
 * @return {Object} URL params.
 */
function getUrlParams() {
	const params = new URLSearchParams( window.location.search );
	return {
		tab: params.get( 'tab' ) || 'library',
		section: params.get( 'section' ) || null,
		block: params.get( 'block' ) || null,
	};
}

/**
 * Update URL with navigation state.
 *
 * @param {Object} updates Params to update.
 */
function updateUrl( updates ) {
	const url = new URL( window.location.href );

	Object.entries( updates ).forEach( ( [ key, value ] ) => {
		if ( value ) {
			url.searchParams.set( key, value );
		} else {
			url.searchParams.delete( key );
		}
	} );

	window.history.replaceState( {}, '', url );
}

/**
 * Main guidelines page component using @wordpress/admin-ui Page wrapper.
 *
 * @return {JSX.Element} The guidelines page.
 */
export default function GuidelinesPage() {
	const [ showHistory, setShowHistory ] = useState( false );

	// Initialize from URL params.
	const initialParams = getUrlParams();
	const [ activeTab, setActiveTab ] = useState( initialParams.tab );
	const [ urlSection, setUrlSection ] = useState( initialParams.section );
	const [ urlBlock, setUrlBlock ] = useState( initialParams.block );

	// Keys to force panel remount when clicking tab while drilled down.
	const [ libraryKey, setLibraryKey ] = useState( 0 );
	const [ blocksKey, setBlocksKey ] = useState( 0 );

	const {
		active,
		draft,
		hasDraftChanges,
		hasGuidelines,
		isSaving,
		isPublishing,
		error,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			active: store.getActive(),
			draft: store.getDraft(),
			hasDraftChanges: store.draftHasChanges(),
			hasGuidelines: store.hasGuidelines(),
			isSaving: store.isSaving(),
			isPublishing: store.isPublishing(),
			error: store.getError(),
		};
	}, [] );

	const { initializeEditor, setError: clearError, saveDraft } = useDispatch( STORE_NAME );

	// Handle tab changes with URL sync.
	const handleTabChange = ( tab ) => {
		// If clicking the same tab while drilled down, reset to root view.
		if ( tab === activeTab ) {
			if ( tab === 'library' && urlSection ) {
				setLibraryKey( ( k ) => k + 1 );
			} else if ( tab === 'blocks' && urlBlock ) {
				setBlocksKey( ( k ) => k + 1 );
			}
		}
		setActiveTab( tab );
		// Clear section/block when changing tabs.
		setUrlSection( null );
		setUrlBlock( null );
		updateUrl( { tab, section: null, block: null } );
	};

	// Handle section changes from LibraryPanel.
	const handleSectionChange = ( section ) => {
		setUrlSection( section );
		updateUrl( { section } );
	};

	// Handle block changes from BlocksPanel.
	const handleBlockChange = ( block ) => {
		setUrlBlock( block );
		updateUrl( { block } );
	};

	// Keyboard shortcut: Ctrl+S / Cmd+S to save draft.
	useEffect( () => {
		const handleKeyDown = ( event ) => {
			if ( ( event.ctrlKey || event.metaKey ) && event.key === 's' ) {
				event.preventDefault();
				if ( hasDraftChanges && ! isSaving && ! isPublishing ) {
					saveDraft();
				}
			}
		};

		document.addEventListener( 'keydown', handleKeyDown );
		return () => {
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ hasDraftChanges, isSaving, isPublishing, saveDraft ] );

	// Initialize editor when guidelines load.
	useEffect( () => {
		if ( active && ! draft ) {
			initializeEditor();
		}
	}, [ active, draft, initializeEditor ] );

	// Loading state.
	const isLoading = active === undefined;

	if ( isLoading ) {
		return (
			<Page title={ __( 'Guidelines', 'content-guidelines' ) }>
				<div className="guidelines-page__loading">
					<Spinner />
					<p>{ __( 'Loading guidelines...', 'content-guidelines' ) }</p>
				</div>
			</Page>
		);
	}

	// Empty state - no guidelines yet.
	if ( ! hasGuidelines ) {
		return (
			<Page title={ __( 'Guidelines', 'content-guidelines' ) }>
				<EmptyState />
			</Page>
		);
	}

	const leftTabs = [
		{ name: 'library', title: __( 'Library', 'content-guidelines' ) },
		{ name: 'blocks', title: __( 'Blocks', 'content-guidelines' ) },
		{ name: 'playground', title: __( 'Playground', 'content-guidelines' ) },
	];

	const rightTabs = [
		{ name: 'import-export', title: __( 'Import / Export', 'content-guidelines' ) },
	];

	return (
		<Page
			title={ __( 'Guidelines', 'content-guidelines' ) }
			actions={
				<HeaderActions
					hasDraft={ hasDraftChanges }
					isSaving={ isSaving }
					isPublishing={ isPublishing }
					error={ error }
					onClearError={ () => clearError( null ) }
					onShowHistory={ () => setShowHistory( true ) }
				/>
			}
		>
			<div className="guidelines-page__tabs">
				<div className="guidelines-page__tab-list" role="tablist">
					<div className="guidelines-page__tab-list-left">
						{ leftTabs.map( ( tab ) => (
							<button
								key={ tab.name }
								role="tab"
								aria-selected={ activeTab === tab.name }
								className={ `guidelines-page__tab ${ activeTab === tab.name ? 'is-active' : '' }` }
								onClick={ () => handleTabChange( tab.name ) }
							>
								{ tab.title }
							</button>
						) ) }
					</div>
					<div className="guidelines-page__tab-list-right">
						{ rightTabs.map( ( tab ) => (
							<button
								key={ tab.name }
								role="tab"
								aria-selected={ activeTab === tab.name }
								className={ `guidelines-page__tab ${ activeTab === tab.name ? 'is-active' : '' }` }
								onClick={ () => handleTabChange( tab.name ) }
							>
								{ tab.title }
							</button>
						) ) }
					</div>
				</div>

				<div className="guidelines-page__tab-panel" role="tabpanel">
					{ activeTab === 'library' && (
						<LibraryPanel
							key={ libraryKey }
							initialSection={ urlSection }
							onSectionChange={ handleSectionChange }
						/>
					) }
					{ activeTab === 'blocks' && (
						<BlocksPanel
							key={ blocksKey }
							initialBlock={ urlBlock }
							onBlockChange={ handleBlockChange }
						/>
					) }
					{ activeTab === 'playground' && <PlaygroundPanel /> }
					{ activeTab === 'import-export' && <ImportExportPanel /> }
				</div>
			</div>

			{ showHistory && (
				<HistoryPanel onClose={ () => setShowHistory( false ) } />
			) }
		</Page>
	);
}
