/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	TextareaControl,
	Card,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { useState, useId } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './guideline-accordion.scss';

interface GuidelineAccordionProps {
	title: string;
	description: string;
}

export default function GuidelineAccordion( {
	title,
	description,
}: GuidelineAccordionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const contentId = useId();
	const headingId = useId();
	const descriptionId = useId();

	return (
		<Card className="content-guidelines__accordion">
			<VStack spacing={ 4 }>
				<HStack spacing={ 4 }>
					<VStack spacing={ 4 }>
						<Heading
							id={ headingId }
							className="content-guidelines__accordion-header"
							level={ 2 }
							size={ 15 }
							weight={ 500 }
						>
							{ title }
						</Heading>
						<Text
							id={ descriptionId }
							className="content-guidelines__accordion-description"
							size={ 13 }
							weight={ 400 }
							color="#757575"
						>
							{ description }
						</Text>
					</VStack>
					<Button
						icon={
							<Icon
								icon={ chevronDown }
								className={ isOpen ? 'rotate-180' : 'rotate-0' }
							/>
						}
						onClick={ () => setIsOpen( ! isOpen ) }
						aria-expanded={ isOpen }
						aria-controls={ contentId }
						aria-label={
							isOpen
								? sprintf(
										/* translators: %s: Guideline title */
										__( 'Collapse %s guidelines' ),
										title
								  )
								: sprintf(
										/* translators: %s: Guideline title */
										__( 'Expand %s guidelines' ),
										title
								  )
						}
					/>
				</HStack>
			</VStack>
			{ isOpen && (
				<form
					id={ contentId }
					aria-labelledby={ headingId }
					aria-describedby={ descriptionId }
					onSubmit={ ( event ) => event.preventDefault() }
					className="content-guidelines__accordion-form"
				>
					<VStack spacing={ 4 }>
						<TextareaControl
							label={ __( 'Copy guidelines' ) }
							hideLabelFromVision
						/>
						<Button
							variant="primary"
							type="submit"
							className="save-button"
						>
							{ __( 'Save guidelines' ) }
						</Button>
					</VStack>
				</form>
			) }
		</Card>
	);
}
