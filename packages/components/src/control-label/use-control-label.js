/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
/*
 * @todo: Refactor this with local useText
 * https://github.com/WordPress/gutenberg/pull/28475
 */
import { useText } from '@wp-g2/components';
import { cx } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import { useFormGroupContextId } from '../form-group';
import * as styles from './control-label-styles';

export function useControlLabel( props ) {
	const {
		htmlFor: htmlForProp,
		isBlock = false,
		size = 'medium',
		truncate = true,
		...otherProps
	} = useContextSystem( props, 'ControlLabel' );

	const { className, ...textProps } = useText( {
		...otherProps,
		isBlock,
		truncate,
	} );

	const htmlFor = useFormGroupContextId( htmlForProp );
	const classes = cx(
		styles.ControlLabel,
		styles[ size ],
		className,
		isBlock ? styles.block : styles.inline
	);

	return {
		...textProps,
		className: classes,
		htmlFor,
	};
}
