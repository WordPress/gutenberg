/**
 * WordPress dependencies
 */
import {
	__experimentalText as WCText,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Card, CollapsibleCard } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { GuidelineAccordionProps } from '../types';

export default function GuidelineAccordion( {
	title,
	description,
	children,
}: GuidelineAccordionProps ) {
	return (
		<CollapsibleCard.Root>
			<CollapsibleCard.Header render={ <h2 /> }>
				<VStack spacing={ 1 }>
					<Card.Title>{ title }</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<WCText variant="muted">{ description }</WCText>
					</CollapsibleCard.HeaderDescription>
				</VStack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>{ children }</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
