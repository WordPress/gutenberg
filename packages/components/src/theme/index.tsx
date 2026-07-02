/**
 * External dependencies
 */
import clsx from 'clsx';
import type { CSSProperties } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ThemeOutputValues, ThemeProps } from './types';
import type { WordPressComponentProps } from '../context';
import { generateThemeVariables } from './color-algorithms';
import styles from './style.module.scss';
import { PolymorphicElement } from '../utils/polymorphic-element';

const getColorVariables = ( { colors }: ThemeOutputValues ) => {
	const style: CSSProperties = {};

	if ( colors.accent ) {
		style[ '--wp-components-color-accent' ] = colors.accent;
	}

	if ( colors.accentDarker10 ) {
		style[ '--wp-components-color-accent-darker-10' ] =
			colors.accentDarker10;
	}

	if ( colors.accentDarker20 ) {
		style[ '--wp-components-color-accent-darker-20' ] =
			colors.accentDarker20;
	}

	if ( colors.accentInverted ) {
		style[ '--wp-components-color-accent-inverted' ] =
			colors.accentInverted;
	}

	if ( colors.background ) {
		style[ '--wp-components-color-background' ] = colors.background;
	}

	if ( colors.foreground ) {
		style[ '--wp-components-color-foreground' ] = colors.foreground;
	}

	if ( colors.foregroundInverted ) {
		style[ '--wp-components-color-foreground-inverted' ] =
			colors.foregroundInverted;
	}

	Object.entries( colors.gray || {} ).forEach( ( [ key, value ] ) => {
		const customProperty = `--wp-components-color-gray-${ key }` as const;
		style[ customProperty ] = value;
	} );

	return style;
};

/**
 * `Theme` allows defining theme variables for components in the `@wordpress/components` package.
 *
 * Multiple `Theme` components can be nested in order to override specific theme variables.
 *
 *
 * ```jsx
 * const Example = () => {
 *   return (
 *     <Theme accent="red">
 *       <Button variant="primary">I'm red</Button>
 *       <Theme accent="blue">
 *         <Button variant="primary">I'm blue</Button>
 *       </Theme>
 *     </Theme>
 *   );
 * };
 * ```
 */
function Theme( {
	accent,
	background,
	className,
	style,
	...props
}: WordPressComponentProps< ThemeProps, 'div', true > ) {
	const themeVariables = useMemo(
		() =>
			getColorVariables(
				generateThemeVariables( { accent, background } )
			),
		[ accent, background ]
	);
	const wrapperStyle = useMemo(
		() => ( {
			...themeVariables,
			...style,
		} ),
		[ style, themeVariables ]
	);

	return (
		<PolymorphicElement
			className={ clsx( styles.wrapper, className ) }
			style={ wrapperStyle }
			{ ...props }
		/>
	);
}

export default Theme;
