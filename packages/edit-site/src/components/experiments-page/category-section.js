/**
 * Internal dependencies
 */
import ExperimentCard from './experiment-card';

/**
 * Category section component that groups experiments.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.categoryKey   Category key identifier.
 * @param {Object}   props.categoryData  Category data with label.
 * @param {Array}    props.experiments   Experiments in this category.
 * @param {Function} props.onToggle      Toggle handler.
 * @param {Set}      props.savingIds     Set of experiment IDs currently saving.
 * @param {Map}      props.recentlySaved Map of experiment IDs recently saved.
 */
export default function CategorySection( {
	categoryKey,
	categoryData,
	experiments,
	onToggle,
	savingIds,
	recentlySaved,
} ) {
	const title = categoryData?.label || categoryKey;
	const enabledCount = experiments.filter( ( exp ) => exp.enabled ).length;

	return (
		<section className="experiments-category">
			<header className="experiments-category__header">
				<h2 className="experiments-category__title">{ title }</h2>
				<span className="experiments-category__count">
					{ enabledCount } / { experiments.length }
				</span>
			</header>
			<div className="experiments-category__grid">
				{ experiments.map( ( experiment ) => (
					<ExperimentCard
						key={ experiment.id }
						experiment={ experiment }
						onToggle={ onToggle }
						isSaving={ savingIds.has( experiment.id ) }
						savedState={ recentlySaved.get( experiment.id ) }
					/>
				) ) }
			</div>
		</section>
	);
}
