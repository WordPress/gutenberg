import clsx from 'clsx';
import styles from '../style.module.scss';
import { COLORS, CONFIG } from '../../utils';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { Border } from '../../border-control/types';
import type { VisualizerProps } from '../types';

const borderBoxStyleWithFallback = ( border?: Border ) => {
	const {
		color = COLORS.gray[ 200 ],
		style = 'solid',
		width = CONFIG.borderWidth,
	} = border || {};

	const clampedWidth =
		width !== CONFIG.borderWidth ? `clamp(1px, ${ width }, 10px)` : width;
	const hasVisibleBorder = ( !! width && width !== '0' ) || !! color;
	const borderStyle = hasVisibleBorder ? style || 'solid' : style;

	return `${ color } ${ borderStyle } ${ clampedWidth }`;
};

export function useBorderBoxControlVisualizer(
	props: WordPressComponentProps< VisualizerProps, 'div' >
) {
	const { className, style, value, ...otherProps } = useContextSystem(
		props,
		'BorderBoxControlVisualizer'
	);

	return {
		...otherProps,
		className: clsx( styles.visualizer, className ),
		style: {
			...style,
			'--wp-components-border-box-visualizer-top':
				borderBoxStyleWithFallback( value?.top ),
			'--wp-components-border-box-visualizer-bottom':
				borderBoxStyleWithFallback( value?.bottom ),
			// Logical properties map left/right to inline start/end for RTL.
			'--wp-components-border-box-visualizer-start':
				borderBoxStyleWithFallback( value?.left ),
			'--wp-components-border-box-visualizer-end':
				borderBoxStyleWithFallback( value?.right ),
		},
		value,
	};
}
