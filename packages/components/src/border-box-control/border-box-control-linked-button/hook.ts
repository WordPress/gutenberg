import clsx from 'clsx';
import styles from '../style.module.scss';
import type { HookReturnProps, WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { LinkedButtonProps } from '../types';

export function useBorderBoxControlLinkedButton(
	props: WordPressComponentProps< LinkedButtonProps, 'button' >
): HookReturnProps<
	WordPressComponentProps< LinkedButtonProps, 'button' >,
	never,
	{ className: string }
> {
	const { className, ...otherProps } = useContextSystem(
		props,
		'BorderBoxControlLinkedButton'
	);

	return {
		...otherProps,
		className: clsx( styles[ 'linked-button' ], className ),
	};
}
