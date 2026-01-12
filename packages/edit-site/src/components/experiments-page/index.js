/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';
import {
	Notice,
	Spinner,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import CategorySection from './category-section';
import HeaderIllustration from './header-illustration';

/**
 * Category labels and order.
 */
const CATEGORY_CONFIG = {
	blocks: { label: __( 'Blocks', 'gutenberg' ) },
	editor: { label: __( 'Editor', 'gutenberg' ) },
	advanced: { label: __( 'Advanced', 'gutenberg' ) },
};

const CATEGORY_ORDER = [ 'blocks', 'editor', 'advanced' ];

/**
 * Main experiments page component.
 *
 * @param {Object} props             Component props.
 * @param {Array}  props.experiments Experiment definitions from PHP.
 */
export default function ExperimentsPage( { experiments: experimentDefs } ) {
	const [ savingIds, setSavingIds ] = useState( new Set() );
	const [ notice, setNotice ] = useState( null );
	const [ recentlySaved, setRecentlySaved ] = useState( new Map() );

	// Use core-data to read/write the gutenberg-experiments setting.
	const {
		record: siteSettings,
		hasResolved,
		save,
		edit,
	} = useEntityRecord( 'root', 'site' );

	// Get current experiment values from settings.
	const gutenbergExperiments = useMemo( () => {
		return siteSettings?.[ 'gutenberg-experiments' ] || {};
	}, [ siteSettings ] );

	// Merge experiment definitions with current values.
	const experiments = useMemo( () => {
		if ( ! experimentDefs || ! hasResolved ) {
			return [];
		}
		return experimentDefs.map( ( exp ) => ( {
			...exp,
			enabled: Boolean( gutenbergExperiments[ exp.id ] ),
		} ) );
	}, [ experimentDefs, gutenbergExperiments, hasResolved ] );

	// Update a single experiment.
	const updateExperiment = useCallback(
		async ( experimentId, enabled ) => {
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
				setTimeout( () => {
					setRecentlySaved( ( prev ) => {
						const next = new Map( prev );
						next.delete( experimentId );
						return next;
					} );
				}, 1500 );
			} catch ( error ) {
				setNotice( {
					status: 'error',
					message: __( 'Failed to save setting.', 'gutenberg' ),
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
		( experimentId, newValue ) => updateExperiment( experimentId, newValue ),
		[ updateExperiment ]
	);

	// Group experiments by category.
	const groupedExperiments = useMemo( () => {
		return CATEGORY_ORDER.reduce( ( acc, category ) => {
			const categoryExperiments = experiments.filter(
				( exp ) => exp.category === category
			);
			if ( categoryExperiments.length > 0 ) {
				acc[ category ] = categoryExperiments;
			}
			return acc;
		}, {} );
	}, [ experiments ] );

	// Count enabled experiments.
	const enabledCount = experiments.filter( ( exp ) => exp.enabled ).length;

	const isLoading = ! hasResolved;

	return (
		<div className="gutenberg-experiments-page">
			<header className="gutenberg-experiments-page__header">
				<div className="gutenberg-experiments-page__header-content">
					<Heading level={ 1 }>
						{ __( 'Experimental Settings', 'gutenberg' ) }
					</Heading>
					<Text className="gutenberg-experiments-page__description">
						{ __(
							"The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.",
							'gutenberg'
						) }
					</Text>
					{ ! isLoading && (
						<div className="gutenberg-experiments-page__badges">
							<span className="gutenberg-experiments-page__badge">
								{ experiments.length }{ ' ' }
								{ __( 'experiments', 'gutenberg' ) }
							</span>
							<span className="gutenberg-experiments-page__badge gutenberg-experiments-page__badge--enabled">
								{ enabledCount } { __( 'enabled', 'gutenberg' ) }
							</span>
						</div>
					) }
				</div>
				<div className="gutenberg-experiments-page__header-illustration">
					<HeaderIllustration />
				</div>
			</header>

			{ notice && (
				<Notice
					status={ notice.status }
					isDismissible
					onRemove={ () => setNotice( null ) }
					className={ `gutenberg-experiments-page__notice gutenberg-experiments-page__notice--${ notice.status }` }
				>
					{ notice.message }
				</Notice>
			) }

			{ isLoading ? (
				<div className="gutenberg-experiments-page__loading">
					<Spinner />
					<Text>{ __( 'Loading experiments...', 'gutenberg' ) }</Text>
				</div>
			) : (
				<div className="gutenberg-experiments-page__categories">
					{ Object.entries( groupedExperiments ).map(
						( [ category, categoryExperiments ] ) => (
							<CategorySection
								key={ category }
								categoryKey={ category }
								categoryData={ CATEGORY_CONFIG[ category ] }
								experiments={ categoryExperiments }
								onToggle={ handleToggle }
								savingIds={ savingIds }
								recentlySaved={ recentlySaved }
							/>
						)
					) }
				</div>
			) }
		</div>
	);
}
