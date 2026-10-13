import clsx from 'clsx';
import styles from '../style.module.scss';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { SplitControlsProps } from '../types';

export function useBorderBoxControlSplitControls(
	props: WordPressComponentProps< SplitControlsProps, 'div' >
) {
	const {
		className,
		colors = [],
		enableAlpha = false,
		enableStyle = true,
		__experimentalIsRenderedInSidebar = false,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlSplitControls' );

	return {
		...otherProps,
		centeredClassName: clsx(
			styles[ 'centered-border-control' ],
			className
		),
		className: clsx( styles[ 'split-controls' ], className ),
		colors,
		enableAlpha,
		enableStyle,
		rightAlignedClassName: clsx(
			styles[ 'right-border-control' ],
			className
		),
		__experimentalIsRenderedInSidebar,
	};
}
