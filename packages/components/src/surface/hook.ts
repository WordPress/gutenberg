/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';
import type { SurfaceProps } from './types';
import type { WordPressComponentProps } from '../context';

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
		variant = 'primary',
		...otherProps
	} = useContextSystem( props, 'Surface' );

	const cx = useCx();

	const classes = useMemo( () => {
		const sx = {
			borders: styles.getBorders( {
				borderBottom,
				borderLeft,
				borderRight,
				borderTop,
			} ),
		};

		return cx(
			styles.Surface,
			sx.borders,
			styles.getVariant(
				variant,
				`${ backgroundSize }px`,
				`${ backgroundSize - 1 }px`
			),
			className
		);
	}, [
		backgroundSize,
		borderBottom,
		borderLeft,
		borderRight,
		borderTop,
		className,
		cx,
		variant,
	] );

	return { ...otherProps, className: classes };
}
