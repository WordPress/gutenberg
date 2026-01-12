/**
 * WordPress dependencies
 */
import {
	useState,
	useCallback,
	useMemo,
	useRef,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import {
	Notice,
	Spinner,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Page } from '@wordpress/admin-ui';

/**
 * Internal dependencies
 */
import CategorySection from './components/category-section';
import './style.scss';

/**
 * Category labels and order.
 */
const CATEGORY_CONFIG = {
	blocks: { label: __( 'Blocks' ) },
	editor: { label: __( 'Editor' ) },
	advanced: { label: __( 'Advanced' ) },
};

const CATEGORY_ORDER = [ 'blocks', 'editor', 'advanced' ];

/**
 * Get experiment definitions.
 * These are registered via the init module.
 */
function getExperimentDefinitions() {
	return ( window as any ).gutenbergExperimentDefinitions || [];
}

/**
 * Main experiments page stage component.
 */
function Stage() {
	const [ savingIds, setSavingIds ] = useState< Set< string > >( new Set() );
	const [ notice, setNotice ] = useState< {
		status: 'success' | 'error';
		message: string;
	} | null >( null );
	const [ recentlySaved, setRecentlySaved ] = useState<
		Map< string, 'enabled' | 'disabled' >
	>( new Map() );

	const experimentDefs = getExperimentDefinitions();

	// Track timeout IDs for cleanup on unmount.
	const timeoutIdsRef = useRef<
		Map< string, ReturnType< typeof setTimeout > >
	>( new Map() );

	// Cleanup all timeouts on unmount.
	useEffect( () => {
		const timeoutIds = timeoutIdsRef.current;
		return () => {
			timeoutIds.forEach( ( timeoutId ) => clearTimeout( timeoutId ) );
			timeoutIds.clear();
		};
	}, [] );

	// Use core-data to read/write the gutenberg-experiments setting.
	const {
		record: siteSettings,
		hasResolved,
		hasResolvedError,
		save,
		edit,
	} = useEntityRecord( 'root', 'site' );

	// Get current experiment values from settings.
	const gutenbergExperiments = useMemo( () => {
		return ( siteSettings as any )?.[ 'gutenberg-experiments' ] || {};
	}, [ siteSettings ] );

	// Merge experiment definitions with current values.
	const experiments = useMemo( () => {
		if ( ! experimentDefs || ! hasResolved ) {
			return [];
		}
		return experimentDefs.map( ( exp: any ) => ( {
			...exp,
			enabled: Boolean( gutenbergExperiments[ exp.id ] ),
		} ) );
	}, [ experimentDefs, gutenbergExperiments, hasResolved ] );

	// Update a single experiment.
	const updateExperiment = useCallback(
		async ( experimentId: string, enabled: boolean ) => {
			setSavingIds( ( prev ) => new Set( prev ).add( experimentId ) );

			try {
				// Build the new experiments object.
				const newExperiments = {
					...gutenbergExperiments,
					[ experimentId ]: enabled,
				};

				// If disabling, remove the key entirely (cleaner storage).
				if ( ! enabled ) {
					delete newExperiments[ experimentId ];
				}

				// Use edit + save for core-data.
				edit( { 'gutenberg-experiments': newExperiments } );
				await save();

				// Show success animation on the icon.
				setRecentlySaved( ( prev ) => {
					const next = new Map( prev );
					next.set( experimentId, enabled ? 'enabled' : 'disabled' );
					return next;
				} );

				// Clear any existing timeout for this experiment.
				if ( timeoutIdsRef.current.has( experimentId ) ) {
					clearTimeout( timeoutIdsRef.current.get( experimentId ) );
				}

				// Set timeout to clear the saved indicator.
				const timeoutId = setTimeout( () => {
					setRecentlySaved( ( prev ) => {
						const next = new Map( prev );
						next.delete( experimentId );
						return next;
					} );
					timeoutIdsRef.current.delete( experimentId );
				}, 1500 );

				timeoutIdsRef.current.set( experimentId, timeoutId );
			} catch ( error ) {
				setNotice( {
					status: 'error',
					message: __( 'Failed to save setting.' ),
				} );
			} finally {
				setSavingIds( ( prev ) => {
					const next = new Set( prev );
					next.delete( experimentId );
					return next;
				} );
			}
		},
		[ gutenbergExperiments, edit, save ]
	);

	// Handle toggle.
	const handleToggle = useCallback(
		( experimentId: string, newValue: boolean ) =>
			updateExperiment( experimentId, newValue ),
		[ updateExperiment ]
	);

	// Group experiments by category.
	const groupedExperiments = useMemo( () => {
		return CATEGORY_ORDER.reduce(
			( acc, category ) => {
				const categoryExperiments = experiments.filter(
					( exp: any ) => exp.category === category
				);
				if ( categoryExperiments.length > 0 ) {
					acc[ category ] = categoryExperiments;
				}
				return acc;
			},
			{} as Record< string, any[] >
		);
	}, [ experiments ] );

	// Count enabled experiments.
	const enabledCount = experiments.filter(
		( exp: any ) => exp.enabled
	).length;

	const isLoading = ! hasResolved;

	// Handle error state when settings fail to load.
	if ( hasResolved && hasResolvedError ) {
		return (
			<Page title={ __( 'Experimental Settings' ) } hasPadding>
				<Notice status="error" isDismissible={ false }>
					{ __(
						'Could not load experiment settings. Please refresh the page or try again later.'
					) }
				</Notice>
			</Page>
		);
	}

	// Handle case where settings resolved but record is empty/invalid.
	if ( hasResolved && ! siteSettings ) {
		return (
			<Page title={ __( 'Experimental Settings' ) } hasPadding>
				<Notice status="error" isDismissible={ false }>
					{ __(
						'Unable to access site settings. Please ensure you have the required permissions.'
					) }
				</Notice>
			</Page>
		);
	}

	return (
		<Page
			title={ __( 'Experimental Settings' ) }
			subTitle={ __(
				"The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production."
			) }
			badges={
				! isLoading ? (
					<>
						<span className="experiments-badge">
							{ experiments.length } { __( 'experiments' ) }
						</span>
						<span className="experiments-badge experiments-badge--enabled">
							{ enabledCount } { __( 'enabled' ) }
						</span>
					</>
				) : null
			}
			className="experiments-page"
		>
			<div className="experiments-page__content">
				{ notice && (
					<Notice
						status={ notice.status }
						isDismissible
						onRemove={ () => setNotice( null ) }
						className="experiments-page__notice"
					>
						{ notice.message }
					</Notice>
				) }

				{ isLoading ? (
					<VStack
						className="experiments-page__loading"
						alignment="center"
						justify="center"
						spacing={ 4 }
					>
						<Spinner />
						<span>{ __( 'Loading experiments…' ) }</span>
					</VStack>
				) : (
					<VStack
						className="experiments-page__categories"
						spacing={ 8 }
					>
						{ Object.entries( groupedExperiments ).map(
							( [ category, categoryExperiments ] ) => (
								<CategorySection
									key={ category }
									categoryKey={ category }
									categoryData={
										CATEGORY_CONFIG[
											category as keyof typeof CATEGORY_CONFIG
										]
									}
									experiments={ categoryExperiments }
									onToggle={ handleToggle }
									savingIds={ savingIds }
									recentlySaved={ recentlySaved }
								/>
							)
						) }
					</VStack>
				) }
			</div>
		</Page>
	);
}

export const stage = Stage;
