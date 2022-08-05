/**
 * External dependencies
 */
import { css, SerializedStyles } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
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

	const sx: {
		Base?: SerializedStyles;
	} = {};

	const contextDisplay = useFlexContext().flexItemDisplay;

	sx.Base = css( {
		display: displayProp || contextDisplay,
	} );

	const cx = useCx();

	const classes = cx(
		styles.Item,
		sx.Base,
		isBlock && styles.block,
		className
	);

	return {
		...otherProps,
		className: classes,
	};
}
