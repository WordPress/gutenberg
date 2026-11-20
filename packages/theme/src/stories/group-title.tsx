import { HeaderMdx } from '@storybook/addon-docs/blocks';
import { useScrollToHash } from './use-scroll-to-hash';

/**
 * Heading for a token group, using the group's own name from the
 * `design-tokens.js` hierarchy (e.g. `font-family` renders as "Font Family").
 * Storybook adds its hover "copy heading URL" link because the heading has an id.
 *
 * @param props
 * @param props.name  Group key.
 * @param props.id    Heading id, used for the hash link.
 * @param props.level Heading level.
 */
export function GroupTitle( {
	name,
	id,
	level = 2,
}: {
	name: string;
	id: string;
	level?: 2 | 3;
} ) {
	useScrollToHash( id );
	return (
		<HeaderMdx as={ `h${ level }` } id={ id }>
			<span style={ { textTransform: 'capitalize' } }>
				{ name.replace( /-/g, ' ' ) }
			</span>
		</HeaderMdx>
	);
}
