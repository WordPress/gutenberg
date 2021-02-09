/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Placeholder, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import LayoutSetupStep from './layout-step';

const BlockSetup = ( { blockName, label, steps } ) => {
	const [ activeStep, setActiveStep ] = useState( 0 );
	const { blockType } = useSelect(
		( select ) => {
			const { getBlockType } = select( blocksStore );
			return { blockType: getBlockType( blockName ) };
		},
		[ blockName ]
	);
	const blockProps = useBlockProps();
	const setUpSteps = useMemo( () => {
		return steps.map( ( step ) => {
			if ( step.useLayoutSetupStep ) {
				return {
					...step,
					content: (
						<LayoutSetupStep
							blockType={ blockType }
							onVariationSelect={ step.onVariationSelect }
							onBlockPatternSelect={ step.onBlockPatternSelect }
						/>
					),
				};
			}
			return step;
		} );
	}, [ steps ] );

	const icon = blockType?.icon?.src; // TODO add a default icon here
	const placeholderLabel = label || blockType?.title;

	const handleNext = () =>
		setActiveStep( ( previousActiveStep ) => previousActiveStep + 1 );
	const handlePrevious = () =>
		setActiveStep( ( previousActiveStep ) => previousActiveStep - 1 );

	const { activeStepContent, instructions } = useMemo( () => {
		return {
			instructions: setUpSteps[ activeStep ]?.instructions,
			activeStepContent: setUpSteps[ activeStep ]?.content,
		};
	}, [ activeStep, setUpSteps ] );
	const stepInfoText = `Step ${ activeStep + 1 } of ${ steps.length }:`;
	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ icon }
				label={ placeholderLabel }
				instructions={ `${ stepInfoText } ${ instructions }` }
				isColumnLayout
			>
				<section className="current-step-container">
					{ activeStepContent }
				</section>
				<BlockSetupNavigation
					totalSteps={ steps.length }
					currentStep={ activeStep }
					handleNext={ handleNext }
					handlePrevious={ handlePrevious }
				/>
			</Placeholder>
		</div>
	);
};

const BlockSetupNavigation = ( {
	handleNext,
	handlePrevious,
	totalSteps,
	currentStep,
} ) => {
	const showPrevious = currentStep !== 0;
	const showNext = currentStep < totalSteps - 1;
	return (
		<div className="block-setup-navigation">
			{ showPrevious && (
				<Button onClick={ handlePrevious }>{ __( 'Previous' ) }</Button>
			) }
			{ showNext && (
				<Button onClick={ handleNext }>{ __( 'Next' ) }</Button>
			) }
		</div>
	);
};

export default BlockSetup;
