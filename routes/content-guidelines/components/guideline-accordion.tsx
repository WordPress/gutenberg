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
	Card,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './guideline-accordion.scss';
import type { GuidelineAccordionProps } from '../types';

export default function GuidelineAccordion( {
	title,
	description,
	children,
	contentId,
	headingId,
	descriptionId,
}: GuidelineAccordionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );

	return (
		<Card className="content-guidelines__accordion">
			<VStack
				spacing={ 4 }
				onClick={ () => setIsOpen( ! isOpen ) }
				className="content-guidelines__accordion-header-container"
			>
				<HStack spacing={ 4 }>
					<VStack spacing={ 1 }>
						<Heading
							id={ headingId }
							className="content-guidelines__accordion-header"
							level={ 2 }
							size={ 15 }
							weight={ 400 }
						>
							{ title }
						</Heading>
						<Text
							id={ descriptionId }
							className="content-guidelines__accordion-description"
							size={ 13 }
							weight={ 400 }
							variant="muted"
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
						onClick={ (
							event: React.MouseEvent< HTMLButtonElement >
						) => {
							event.stopPropagation();
							setIsOpen( ! isOpen );
						} }
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
			{ isOpen && children }
		</Card>
	);
}
