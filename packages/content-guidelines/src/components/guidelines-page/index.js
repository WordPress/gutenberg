/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { Spinner, Notice, Button } from '@wordpress/components';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useGuidelines } from '../../hooks';
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
 * @param {boolean}  props.hasChanges    Whether there are unsaved changes.
 * @param {boolean}  props.isSaving      Whether currently saving.
 * @param {Function} props.onSave        Callback to save changes.
 * @param {string}   props.error         Error message if any.
 * @param {Function} props.onClearError  Callback to clear error.
 * @param {Function} props.onShowHistory Callback to show history.
 * @return {JSX.Element} Header actions.
 */
function HeaderActions( {
	hasChanges,
	isSaving,
	onSave,
	error,
	onClearError,
	onShowHistory,
} ) {
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
				{ hasChanges && ! error && (
					<span className="guidelines-page__draft-indicator">
						{ __( 'Unsaved changes' ) }
					</span>
				) }
			</div>
			<div className="guidelines-page__header-buttons">
				<Button
					icon={ backup }
					label={ __( 'History' ) }
					onClick={ onShowHistory }
					__next40pxDefaultSize
				/>
				<Button
					variant="primary"
					onClick={ onSave }
					isBusy={ isSaving }
					disabled={ isSaving || ! hasChanges }
					accessibleWhenDisabled
					__next40pxDefaultSize
				>
					{ __( 'Save' ) }
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
	const urlTab = params.get( 'tab' ) || params.get( 'section' );
	const postIdParam = params.get( 'post' );
	const parsedPostId = postIdParam ? parseInt( postIdParam, 10 ) : null;
	const fixturePostId = Number.isNaN( parsedPostId ) ? null : parsedPostId;
	return {
		tab: urlTab || 'library',
		section: params.get( 'section' ) || null,
		block: params.get( 'block' ) || null,
		history: params.get( 'history' ) === '1',
		fixturePostId,
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
	const [ isSaving, setIsSaving ] = useState( false );
	const [ error, setError ] = useState( null );

	// Initialize from URL params.
	const initialParams = getUrlParams();
	const [ showHistory, setShowHistory ] = useState( initialParams.history );
	const [ activeTab, setActiveTab ] = useState( initialParams.tab );
	const [ urlSection, setUrlSection ] = useState( initialParams.section );
	const [ urlBlock, setUrlBlock ] = useState( initialParams.block );
	const fixturePostId = initialParams.fixturePostId;

	// Keys to force panel remount when clicking tab while drilled down.
	const [ libraryKey, setLibraryKey ] = useState( 0 );
	const [ blocksKey, setBlocksKey ] = useState( 0 );

	// Use the canonical guidelines hook.
	const { guidelines, hasChanges, isLoading, save } = useGuidelines();

	// Save handler.
	const handleSave = useCallback( async () => {
		setIsSaving( true );
		setError( null );
		try {
			await save();
		} catch ( err ) {
			setError( err.message || __( 'Failed to save guidelines.' ) );
		} finally {
			setIsSaving( false );
		}
	}, [ save ] );

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

	const handleShowHistory = () => {
		setShowHistory( true );
		updateUrl( { history: '1' } );
	};

	const handleCloseHistory = () => {
		setShowHistory( false );
		updateUrl( { history: null } );
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

	// Keyboard shortcut: Ctrl+S / Cmd+S to save.
	useEffect( () => {
		const handleKeyDown = ( event ) => {
			if ( ( event.ctrlKey || event.metaKey ) && event.key === 's' ) {
				event.preventDefault();
				if ( hasChanges && ! isSaving ) {
					handleSave();
				}
			}
		};

		document.addEventListener( 'keydown', handleKeyDown );
		return () => {
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ handleSave, hasChanges, isSaving ] );

	if ( isLoading ) {
		return (
			<Page title={ __( 'Guidelines' ) }>
				<div className="guidelines-page__loading">
					<Spinner />
					<p>{ __( 'Loading guidelines…' ) }</p>
				</div>
			</Page>
		);
	}

	// Empty state - no guidelines yet.
	if ( ! guidelines ) {
		return (
			<Page title={ __( 'Guidelines' ) }>
				<EmptyState />
			</Page>
		);
	}

	const leftTabs = [
		{ name: 'library', title: __( 'Library' ) },
		{ name: 'blocks', title: __( 'Blocks' ) },
		{ name: 'playground', title: __( 'Playground' ) },
	];

	const rightTabs = [
		{
			name: 'import-export',
			title: __( 'Import / Export' ),
		},
	];

	return (
		<Page
			title={ __( 'Guidelines' ) }
			actions={
				<HeaderActions
					hasChanges={ hasChanges }
					isSaving={ isSaving }
					onSave={ handleSave }
					error={ error }
					onClearError={ () => setError( null ) }
					onShowHistory={ handleShowHistory }
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
								className={ `guidelines-page__tab ${
									activeTab === tab.name ? 'is-active' : ''
								}` }
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
								className={ `guidelines-page__tab ${
									activeTab === tab.name ? 'is-active' : ''
								}` }
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
					{ activeTab === 'playground' && (
						<PlaygroundPanel fixturePostId={ fixturePostId } />
					) }
					{ activeTab === 'import-export' && <ImportExportPanel /> }
				</div>
			</div>

			{ showHistory && <HistoryPanel onClose={ handleCloseHistory } /> }
		</Page>
	);
}
