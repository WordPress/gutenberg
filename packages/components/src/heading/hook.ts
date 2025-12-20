/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import { useText } from '../text';
import { getHeadingFontSize } from '../utils/font-size';
import { CONFIG, COLORS } from '../utils';
import type { HeadingProps } from './types';

export function useHeading(
	props: WordPressComponentProps< HeadingProps, 'h1' >
) {
	const {
		as: asProp,
		level = 2,
		color = COLORS.theme.foreground,
		isBlock = true,
		weight = CONFIG.fontWeightHeading as import('react').CSSProperties[ 'fontWeight' ],
		...otherProps
	} = useContextSystem( props, 'Heading' );

	const as = ( asProp || `h${ level }` ) as keyof JSX.IntrinsicElements;

	const a11yProps: {
		role?: string;
		'aria-level'?: number;
	} = {};
	if ( typeof as === 'string' && as[ 0 ] !== 'h' ) {
		// If not a semantic `h` element, add a11y props:
		a11yProps.role = 'heading';
		a11yProps[ 'aria-level' ] =
			typeof level === 'string' ? parseInt( level ) : level;
	}

	const textProps = useText( {
		color,
		isBlock,
		weight,
		size: getHeadingFontSize( level ),
		...otherProps,
	} );

	return { ...textProps, ...a11yProps, as };
}
