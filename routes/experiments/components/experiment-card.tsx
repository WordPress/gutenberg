/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	ToggleControl,
	Spinner,
	ExternalLink,
	Icon,
	__experimentalText as Text,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import {
	blockDefault,
	postComments,
	grid,
	cancelCircleFilled,
	image,
	people,
	color,
	pencil,
	gallery,
	globe,
	layout,
	settings,
	tool,
	navigation,
	mobile,
	plugins,
	check,
	lineSolid,
} from '@wordpress/icons';

/**
 * Icon mapping for experiments.
 */
const EXPERIMENT_ICONS: Record< string, typeof blockDefault > = {
	blockDefault,
	postComments,
	grid,
	cancelCircleFilled,
	image,
	people,
	color,
	pencil,
	gallery,
	globe,
	layout,
	settings,
	tool,
	navigation,
	mobile,
	plugins,
};

interface Experiment {
	id: string;
	name: string;
	description: string;
	warning?: string;
	learnMore?: string;
	enabled: boolean;
	icon: string;
}

interface ExperimentCardProps {
	experiment: Experiment;
	onToggle: ( experimentId: string, newValue: boolean ) => void;
	isSaving: boolean;
	savedState?: 'enabled' | 'disabled';
}

/**
 * Individual experiment card component.
 *
 * @param root0            Component props.
 * @param root0.experiment The experiment data object.
 * @param root0.onToggle   Callback when the experiment is toggled.
 * @param root0.isSaving   Whether the experiment is currently being saved.
 * @param root0.savedState The recently saved state, if any.
 */
export default function ExperimentCard( {
	experiment,
	onToggle,
	isSaving,
	savedState,
}: ExperimentCardProps ) {
	const { id, name, description, warning, learnMore, enabled, icon } =
		experiment;
	const ExperimentIcon = EXPERIMENT_ICONS[ icon ] || plugins;

	const cardClasses = clsx( 'experiment-card', {
		'experiment-card--enabled': enabled,
		'experiment-card--saved': savedState,
		'experiment-card--saving': isSaving,
	} );

	return (
		<Card className={ cardClasses } size="small">
			<CardHeader className="experiment-card__header">
				<HStack alignment="center" spacing={ 3 }>
					<div className="experiment-card__icon-wrapper">
						<div
							className={ clsx( 'experiment-card__icon', {
								'experiment-card__icon--active': enabled,
							} ) }
						>
							<Icon icon={ ExperimentIcon } size={ 20 } />
							{ savedState === 'enabled' && (
								<div className="experiment-card__saved-indicator experiment-card__saved-indicator--enabled">
									<Icon icon={ check } size={ 14 } />
								</div>
							) }
							{ savedState === 'disabled' && (
								<div className="experiment-card__saved-indicator experiment-card__saved-indicator--disabled">
									<Icon icon={ lineSolid } size={ 14 } />
								</div>
							) }
						</div>
					</div>
					<div className="experiment-card__title-wrapper">
						<h4 className="experiment-card__title">{ name }</h4>
					</div>
					<div className="experiment-card__toggle-wrapper">
						<div className="experiment-card__toggle-container">
							{ isSaving ? (
								<div className="experiment-card__spinner">
									<Spinner />
								</div>
							) : (
								<ToggleControl
									__nextHasNoMarginBottom
									label={ name }
									checked={ enabled }
									onChange={ ( value ) =>
										onToggle( id, value )
									}
									disabled={ isSaving }
								/>
							) }
						</div>
					</div>
				</HStack>
			</CardHeader>
			<CardBody className="experiment-card__body">
				<Text className="experiment-card__description">
					{ description }
				</Text>
				{ warning && (
					<div className="experiment-card__warning">
						<Text>{ warning }</Text>
					</div>
				) }
			</CardBody>
			{ learnMore && (
				<CardFooter className="experiment-card__footer">
					<ExternalLink href={ learnMore }>
						{ __( 'Learn more' ) }
					</ExternalLink>
				</CardFooter>
			) }
		</Card>
	);
}
