/**
 * Internal dependencies
 */
import ExperimentCard from './experiment-card';

/**
 * Category section component that groups experiments.
 *
 * @param {Object}   props                Component props.
 * @param {string}   props.categoryKey    Category key identifier.
 * @param {Object}   props.categoryData   Category data with label and icon.
 * @param {Array}    props.experiments    Experiments in this category.
 * @param {Array}    props.allExperiments All experiments for dependency checking.
 * @param {Function} props.onToggle       Toggle handler.
 * @param {Set}      props.savingIds      Set of experiment IDs currently saving.
 * @param {Set}      props.recentlySaved  Set of experiment IDs recently saved.
 */
export default function CategorySection( {
	categoryKey,
	categoryData,
	experiments,
	allExperiments,
	onToggle,
	savingIds,
	recentlySaved,
} ) {
	const title = categoryData?.label || categoryKey;
	const enabledCount = experiments.filter( ( exp ) => exp.enabled ).length;

	/**
	 * Get the required experiment if dependency is unmet.
	 *
	 * @param {Object} experiment The experiment to check.
	 * @return {Object|null} The required experiment object, or null if no unmet dependency.
	 */
	const getRequiredExperiment = ( experiment ) => {
		if ( ! experiment.requires ) {
			return null;
		}

		const requiredExp = allExperiments.find(
			( exp ) => exp.id === experiment.requires
		);

		if ( requiredExp && ! requiredExp.enabled ) {
			return requiredExp;
		}

		return null;
	};

	return (
		<section className="experiments-category">
			<header className="experiments-category__header">
				<h2 className="experiments-category__title">{ title }</h2>
				<span className="experiments-category__count">
					{ enabledCount } / { experiments.length }
				</span>
			</header>
			<div className="experiments-category__grid">
				{ experiments.map( ( experiment ) => {
					const requiredExperiment =
						getRequiredExperiment( experiment );
					return (
						<ExperimentCard
							key={ experiment.id }
							experiment={ experiment }
							onToggle={ onToggle }
							isSaving={ savingIds.has( experiment.id ) }
							requiredExperiment={ requiredExperiment }
							savedState={ recentlySaved.get( experiment.id ) }
						/>
					);
				} ) }
			</div>
		</section>
	);
}
