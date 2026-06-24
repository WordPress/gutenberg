/**
 * External dependencies
 */
import clsx from 'clsx';
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import type { SurfaceProps } from './types';
import type { WordPressComponentProps } from '../context';
import styles from './style.module.scss';

type SurfaceStyle = CSSProperties & {
	'--wp-components-surface-background-size'?: string;
	'--wp-components-surface-background-size-dotted'?: string;
};

export function useSurface(
	props: WordPressComponentProps< SurfaceProps, 'div' >
) {
	const {
		backgroundSize = 12,
		borderBottom = false,
		borderLeft = false,
		borderRight = false,
		borderTop = false,
		className,
		style,
		variant = 'primary',
		...otherProps
	} = useContextSystem( props, 'Surface' );

	const hasPatternBackground = variant === 'dotted' || variant === 'grid';
	const surfaceStyle: SurfaceStyle | undefined = hasPatternBackground
		? {
				...style,
				'--wp-components-surface-background-size': `${ backgroundSize }px`,
				'--wp-components-surface-background-size-dotted': `${
					backgroundSize - 1
				}px`,
		  }
		: style;

	return {
		...otherProps,
		className: clsx(
			styles.surface,
			{
				[ styles.borderBottom ]: borderBottom,
				[ styles.borderLeft ]: borderLeft,
				[ styles.borderRight ]: borderRight,
				[ styles.borderTop ]: borderTop,
				[ styles.secondary ]: variant === 'secondary',
				[ styles.dotted ]: variant === 'dotted',
				[ styles.grid ]: variant === 'grid',
			},
			className
		),
		style: surfaceStyle,
	};
}
