import clsx from 'clsx';
import { useContextSystem } from '../context';
import type { SurfaceProps } from './types';
import type { HookReturnProps, WordPressComponentProps } from '../context';
import styles from './style.module.scss';

export function useSurface(
	props: WordPressComponentProps< SurfaceProps, 'div' >
): HookReturnProps<
	WordPressComponentProps< SurfaceProps, 'div' >,
	| 'backgroundSize'
	| 'borderBottom'
	| 'borderLeft'
	| 'borderRight'
	| 'borderTop'
	| 'variant',
	{ className: string; style: React.CSSProperties | undefined }
> {
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
	const surfaceStyle = hasPatternBackground
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
				[ styles[ 'border-bottom' ] ]: borderBottom,
				[ styles[ 'border-left' ] ]: borderLeft,
				[ styles[ 'border-right' ] ]: borderRight,
				[ styles[ 'border-top' ] ]: borderTop,
				[ styles.secondary ]: variant === 'secondary',
				[ styles.dotted ]: variant === 'dotted',
				[ styles.grid ]: variant === 'grid',
			},
			className
		),
		style: surfaceStyle,
	};
}
