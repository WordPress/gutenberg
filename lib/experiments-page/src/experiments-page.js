/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	Notice,
	Spinner,
	Modal,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { caution } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import CategorySection from './components/category-section';
import HeaderIllustration from './components/header-illustration';

/**
 * Main experiments page component.
 */
export default function ExperimentsPage() {
	const [ experiments, setExperiments ] = useState( [] );
	const [ categories, setCategories ] = useState( {} );
	const [ categoryOrder, setCategoryOrder ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ savingIds, setSavingIds ] = useState( new Set() );
	const [ notice, setNotice ] = useState( null );
	const [ confirmModal, setConfirmModal ] = useState( null );
	const [ dependencyModal, setDependencyModal ] = useState( null );
	const [ recentlySaved, setRecentlySaved ] = useState( new Map() );

	// Fetch experiments on mount.
	useEffect( () => {
		apiFetch( { path: '/gutenberg/v1/experiments' } )
			.then( ( response ) => {
				setExperiments( response.experiments );
				setCategories( response.categories );
				setCategoryOrder( response.categoryOrder );
			} )
			.catch( () => {
				setNotice( {
					status: 'error',
					message: __( 'Failed to load experiments.', 'gutenberg' ),
				} );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [] );

	// Find experiments that depend on a given experiment.
	const findDependents = useCallback(
		( experimentId ) => {
			return experiments.filter(
				( exp ) => exp.requires === experimentId && exp.enabled
			);
		},
		[ experiments ]
	);

	// Handle toggle with dependency checking.
	const handleToggle = useCallback(
		async ( experimentId, newValue, requiredExperiment ) => {
			// If enabling and there's an unmet dependency, show the dependency modal.
			if ( newValue && requiredExperiment ) {
				const experiment = experiments.find(
					( exp ) => exp.id === experimentId
				);
				setDependencyModal( {
					experiment,
					requiredExperiment,
				} );
				return;
			}

			// If disabling, check for dependents.
			if ( ! newValue ) {
				const dependents = findDependents( experimentId );
				if ( dependents.length > 0 ) {
					setConfirmModal( {
						experimentId,
						dependents,
					} );
					return;
				}
			}

			// Proceed with the update.
			await updateExperiment( experimentId, newValue );
		},
		[ findDependents, experiments ]
	);

	// Update a single experiment.
	const updateExperiment = async ( experimentId, enabled ) => {
		setSavingIds( ( prev ) => new Set( prev ).add( experimentId ) );

		try {
			await apiFetch( {
				path: '/gutenberg/v1/experiments',
				method: 'POST',
				data: { id: experimentId, enabled },
			} );

			setExperiments( ( prev ) =>
				prev.map( ( exp ) =>
					exp.id === experimentId ? { ...exp, enabled } : exp
				)
			);

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
	};

	// Handle confirmation of disabling with dependents.
	const handleConfirmDisable = async () => {
		if ( ! confirmModal ) {
			return;
		}

		const { experimentId, dependents } = confirmModal;
		setConfirmModal( null );

		// Disable all dependents first.
		for ( const dep of dependents ) {
			await updateExperiment( dep.id, false );
		}

		// Then disable the parent.
		await updateExperiment( experimentId, false );
	};

	// Handle confirmation of enabling with dependencies.
	const handleConfirmEnableWithDependency = async () => {
		if ( ! dependencyModal ) {
			return;
		}

		const { experiment, requiredExperiment } = dependencyModal;
		setDependencyModal( null );

		// Enable the required experiment first.
		await updateExperiment( requiredExperiment.id, true );

		// Then enable the requested experiment.
		await updateExperiment( experiment.id, true );
	};

	// Group experiments by category.
	const groupedExperiments = categoryOrder.reduce( ( acc, category ) => {
		const categoryExperiments = experiments.filter(
			( exp ) => exp.category === category
		);
		if ( categoryExperiments.length > 0 ) {
			acc[ category ] = categoryExperiments;
		}
		return acc;
	}, {} );

	// Count enabled experiments.
	const enabledCount = experiments.filter( ( exp ) => exp.enabled ).length;

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
								categoryData={ categories[ category ] }
								experiments={ categoryExperiments }
								allExperiments={ experiments }
								onToggle={ handleToggle }
								savingIds={ savingIds }
								recentlySaved={ recentlySaved }
							/>
						)
					) }
				</div>
			) }

			{ confirmModal && (
				<Modal
					title={ __( 'Disable Experiment?', 'gutenberg' ) }
					onRequestClose={ () => setConfirmModal( null ) }
					className="gutenberg-experiments-page__modal"
					icon={ caution }
				>
					<Text>
						{ __(
							'The following experiments depend on this one and will also be disabled:',
							'gutenberg'
						) }
					</Text>
					<ul className="gutenberg-experiments-page__modal-list">
						{ confirmModal.dependents.map( ( dep ) => (
							<li key={ dep.id }>{ dep.name }</li>
						) ) }
					</ul>
					<div className="gutenberg-experiments-page__modal-actions">
						<Button
							variant="secondary"
							onClick={ () => setConfirmModal( null ) }
						>
							{ __( 'Cancel', 'gutenberg' ) }
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={ handleConfirmDisable }
						>
							{ __( 'Disable All', 'gutenberg' ) }
						</Button>
					</div>
				</Modal>
			) }

			{ dependencyModal && (
				<Modal
					title={ __( 'Enable Required Experiment?', 'gutenberg' ) }
					onRequestClose={ () => setDependencyModal( null ) }
					className="gutenberg-experiments-page__modal"
				>
					<Text>
						<strong>{ dependencyModal.experiment.name }</strong>{ ' ' }
						{ __( 'requires', 'gutenberg' ) }{ ' ' }
						<strong>
							{ dependencyModal.requiredExperiment.name }
						</strong>{ ' ' }
						{ __( 'to be enabled first.', 'gutenberg' ) }
					</Text>
					<Text style={ { marginTop: '12px', display: 'block' } }>
						{ __(
							'Would you like to enable both experiments?',
							'gutenberg'
						) }
					</Text>
					<div className="gutenberg-experiments-page__modal-actions">
						<Button
							variant="secondary"
							onClick={ () => setDependencyModal( null ) }
						>
							{ __( 'Cancel', 'gutenberg' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ handleConfirmEnableWithDependency }
						>
							{ __( 'Enable Both', 'gutenberg' ) }
						</Button>
					</div>
				</Modal>
			) }
		</div>
	);
}
