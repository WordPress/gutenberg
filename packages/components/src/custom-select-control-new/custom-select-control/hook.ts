/**
 * External dependencies
 */
import { useSelectState } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import type { WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import { SelectControlProps } from '../types';

// TODO:
// - should we use 'select' instead of `div` for props inheritance?
// - should we allow polymorphism ?
export const useSelectControl = ( {
	value,
	className,
	...props
}: WordPressComponentProps< SelectControlProps, 'select', false > ) => {
	// TODO: take some of these settings as props?
	const selectState = useSelectState( {
		// TODO: check if it works, understand if we should expose
		// a different prop for the initial value?
		defaultValue: value,
		sameWidth: true,
		gutter: 4,
	} );

	// TODO: deprecate options prop

	const cx = useCx();
	const wrapperClassName = useMemo(
		() => cx( styles.wrapper, className ),
		[ className, cx ]
	);
	const labelClassName = useMemo(
		() => cx( styles.label, className ),
		[ className, cx ]
	);
	const selectClassName = useMemo(
		() => cx( styles.select, className ),
		[ className, cx ]
	);
	const popoverClassName = useMemo(
		() => cx( styles.popover, className ),
		[ className, cx ]
	);

	return {
		...props,
		selectState,
		wrapperClassName,
		labelClassName,
		selectClassName,
		popoverClassName,
	};
};
