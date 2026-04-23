/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalText as WCText,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Card,
	Button,
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
		<Card className="guidelines__accordion">
			<Button
				className="guidelines__accordion-trigger"
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				aria-controls={ contentId }
				aria-describedby={ descriptionId }
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
			>
				<HStack spacing={ 4 }>
					<VStack spacing={ 1 }>
						<Heading
							id={ headingId }
							className="guidelines__accordion-header"
							level={ 2 }
							size={ 15 }
							weight={ 400 }
						>
							{ title }
						</Heading>
						<WCText
							id={ descriptionId }
							className="guidelines__accordion-description"
							size={ 13 }
							weight={ 400 }
							variant="muted"
						>
							{ description }
						</WCText>
					</VStack>
					<Icon
						icon={ chevronDown }
						className={
							isOpen
								? 'guidelines__accordion-chevron-up'
								: 'guidelines__accordion-chevron-down'
						}
					/>
				</HStack>
			</Button>
			<div hidden={ ! isOpen }>{ children }</div>
		</Card>
	);
}
