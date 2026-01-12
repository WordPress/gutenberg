/**
 * Internal dependencies
 */
import ExperimentCard from './experiment-card';

interface Experiment {
	id: string;
	name: string;
	description: string;
	warning?: string;
	learnMore?: string;
	enabled: boolean;
	icon: string;
	category: string;
}

interface CategoryData {
	label: string;
}

interface CategorySectionProps {
	categoryKey: string;
	categoryData: CategoryData;
	experiments: Experiment[];
	onToggle: ( experimentId: string, newValue: boolean ) => void;
	savingIds: Set< string >;
	recentlySaved: Map< string, 'enabled' | 'disabled' >;
}

/**
 * Category section component that groups experiments.
 *
 * @param root0               Component props.
 * @param root0.categoryKey   The category identifier.
 * @param root0.categoryData  The category metadata.
 * @param root0.experiments   Array of experiments in this category.
 * @param root0.onToggle      Callback when an experiment is toggled.
 * @param root0.savingIds     Set of experiment IDs currently being saved.
 * @param root0.recentlySaved Map of recently saved experiment states.
 */
export default function CategorySection( {
	categoryKey,
	categoryData,
	experiments,
	onToggle,
	savingIds,
	recentlySaved,
}: CategorySectionProps ) {
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
