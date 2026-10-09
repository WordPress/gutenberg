import { headingStyle } from './token-preview-styles';

/**
 * Heading for a token group, using the group's own name from the
 * `design-tokens.js` hierarchy (e.g. `font-family` renders as "Font Family").
 *
 * @param props
 * @param props.name  Group key.
 * @param props.level Heading level.
 */
export function GroupTitle( {
	name,
	level = 2,
}: {
	name: string;
	level?: 2 | 3;
} ) {
	const Heading = `h${ level }` as const;
	return (
		<Heading style={ { ...headingStyle, textTransform: 'capitalize' } }>
			{ name.replace( /-/g, ' ' ) }
		</Heading>
	);
}
