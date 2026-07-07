import clsx from 'clsx';
import type { CSSProperties } from 'react';

import { useMemo } from '@wordpress/element';

import type { ThemeOutputValues, ThemeProps } from './types';
import type { WordPressComponentProps } from '../context';
import { generateThemeVariables } from './color-algorithms';
import styles from './style.module.scss';
import { PolymorphicElement } from '../utils/polymorphic-element';

const getColorVariables = ( {
	colors,
}: ThemeOutputValues ): CSSProperties => ( {
	'--wp-components-color-accent': colors.accent,
	'--wp-components-color-accent-darker-10': colors.accentDarker10,
	'--wp-components-color-accent-darker-20': colors.accentDarker20,
	'--wp-components-color-accent-inverted': colors.accentInverted,
	'--wp-components-color-background': colors.background,
	'--wp-components-color-foreground': colors.foreground,
	'--wp-components-color-foreground-inverted': colors.foregroundInverted,
	...Object.fromEntries(
		Object.entries( colors.gray ?? {} ).map( ( [ key, value ] ) => [
			`--wp-components-color-gray-${ key }`,
			value,
		] )
	),
} );

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
