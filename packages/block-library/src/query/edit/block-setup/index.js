/**
 * WordPress dependencies
 */
// import { useSelect } from '@wordpress/data';
import { useBlockProps } from '@wordpress/block-editor';
// import { store as blocksStore } from '@wordpress/blocks';
// import { useState } from '@wordpress/element';
// import { __ } from '@wordpress/i18n';
import { Placeholder } from '@wordpress/components';

const BlockSetup = ( { icon, label, children } ) => {
	// const [ activeStep, setActiveStep ] = useState( 0 );
	const blockProps = useBlockProps();
	// const handleNext = () =>
	// 	setActiveStep( ( previousActiveStep ) => previousActiveStep + 1 );
	// const handlePrevious = () =>
	// 	setActiveStep( ( previousActiveStep ) => previousActiveStep - 1 );

	// const { activeStepContent, instructions } = useMemo( () => {
	// 	return {
	// 		instructions: setUpSteps[ activeStep ]?.instructions,
	// 		activeStepContent: setUpSteps[ activeStep ]?.content,
	// 	};
	// }, [ activeStep, setUpSteps ] );
	// const stepInfoText = `Step ${ activeStep + 1 } of ${ steps.length }:`;
	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ icon }
				label={ label }
				// instructions={ `${ stepInfoText } ${ instructions }` }
				isColumnLayout
			>
				{ children }
				{ /* <section className="current-step-container">
					{ activeStepContent }
				</section> */ }
				{ /* <BlockSetupNavigation
					totalSteps={ steps.length }
					currentStep={ activeStep }
					handleNext={ handleNext }
					handlePrevious={ handlePrevious }
				/> */ }
			</Placeholder>
		</div>
	);
};

// const BlockSetupNavigation = ( {
// 	handleNext,
// 	handlePrevious,
// 	totalSteps,
// 	currentStep,
// } ) => {
// 	const showPrevious = currentStep !== 0;
// 	const showNext = currentStep < totalSteps - 1;
// 	return (
// 		<div className="block-setup-navigation">
// 			{ showPrevious && (
// 				<Button onClick={ handlePrevious }>{ __( 'Previous' ) }</Button>
// 			) }
// 			{ showNext && (
// 				<Button onClick={ handleNext }>{ __( 'Next' ) }</Button>
// 			) }
// 		</div>
// 	);
// };

export default BlockSetup;
