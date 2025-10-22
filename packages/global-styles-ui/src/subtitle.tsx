/**
 * WordPress dependencies
 */
import { __experimentalHeading as Heading } from '@wordpress/components';

interface SubtitleProps {
	children: React.ReactNode;
	level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Subtitle( { children, level = 2 }: SubtitleProps ) {
	return (
		<Heading className="global-styles-ui-subtitle" level={ level }>
			{ children }
		</Heading>
	);
}
