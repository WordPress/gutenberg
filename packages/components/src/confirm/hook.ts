/**
 * Internal dependencies
 */
import { useContextSystem, PolymorphicComponentProps } from '../ui/context';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';
import type { OwnProps } from './types';

export function useConfirm(
	props: PolymorphicComponentProps< OwnProps, 'div' >
) {
	const { className, ...otherProps } = useContextSystem( props, 'Confirm' );

	const cx = useCx();

	const classes = cx( className );
	const wrapperClassName = cx( styles.overlayWrapper );
	const dialogWrapperClassName = cx( styles.dialogWrapper );

	console.log( otherProps );

	return {
		className: classes,
		wrapperClassName,
		dialogWrapperClassName,
		...otherProps,
	};
}
