/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { useText } from '../text';
import { getHeadingFontSize } from '../ui/utils/font-size';
import { CONFIG, COLORS } from '../utils';
import type { HeadingProps } from './types';

export function useHeading(
	props: WordPressComponentProps< HeadingProps, 'h1' >
) {
	const {
		as: asProp,
		level = 2,
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
		color: COLORS.gray[ 900 ],
		size: getHeadingFontSize( level ),
		isBlock: true,
		weight: CONFIG.fontWeightHeading as import('react').CSSProperties[ 'fontWeight' ],
		...otherProps,
	} );

	return { ...textProps, ...a11yProps, as };
}
