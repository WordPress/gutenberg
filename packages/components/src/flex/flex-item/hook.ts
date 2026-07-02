import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useFlexContext } from '../context';
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';
import type { FlexItemProps } from '../types';

export function useFlexItem(
	props: WordPressComponentProps< FlexItemProps, 'div' >
) {
	const {
		className,
		display: displayProp,
		isBlock = false,
		...otherProps
	} = useContextSystem( props, 'FlexItem' );

	const contextDisplay = useFlexContext().flexItemDisplay;

	const base = css( {
		display: displayProp || contextDisplay,
	} );

	const cx = useCx();

	const itemStyles = css( styles.Item, base, isBlock && styles.block );

	const classes = cx( itemStyles, className );

	return {
		...otherProps,
		className: classes,
	};
}
