import { Card as CardRoot } from './primitives/card';
import { CardBody } from './primitives/card-body';
import { CardHeader } from './primitives/card-header';
import { CardSummary } from './primitives/card-summary';

/**
 * A card component with header, body, and footer slots.
 */
export const Card = Object.assign( CardRoot, {
	Header: CardHeader,
	Body: CardBody,
	Summary: CardSummary,
} ) as typeof CardRoot & {
	Header: typeof CardHeader;
	Body: typeof CardBody;
	Summary: typeof CardSummary;
};
