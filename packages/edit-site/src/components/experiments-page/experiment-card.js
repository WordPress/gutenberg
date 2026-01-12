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
	Flex,
	FlexItem,
	Icon,
	__experimentalText as Text,
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
const EXPERIMENT_ICONS = {
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

/**
 * Individual experiment card component.
 *
 * @param {Object}   props            Component props.
 * @param {Object}   props.experiment Experiment data.
 * @param {Function} props.onToggle   Toggle handler.
 * @param {boolean}  props.isSaving   Whether the experiment is currently saving.
 * @param {string}   props.savedState State of recent save: 'enabled', 'disabled', or undefined.
 */
export default function ExperimentCard( {
	experiment,
	onToggle,
	isSaving,
	savedState,
} ) {
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
				<Flex align="center" gap={ 3 }>
					<FlexItem className="experiment-card__icon-wrapper">
						<div
							className={ `experiment-card__icon ${
								enabled ? 'experiment-card__icon--active' : ''
							}` }
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
					</FlexItem>
					<FlexItem className="experiment-card__title-wrapper">
						<h4 className="experiment-card__title">{ name }</h4>
					</FlexItem>
					<FlexItem className="experiment-card__toggle-wrapper">
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
									onChange={ ( value ) => onToggle( id, value ) }
									disabled={ isSaving }
								/>
							) }
						</div>
					</FlexItem>
				</Flex>
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
						{ __( 'Learn more', 'gutenberg' ) }
					</ExternalLink>
				</CardFooter>
			) }
		</Card>
	);
}
