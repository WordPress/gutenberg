/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks';
import useMarksData from './use-marks-data';

import type { MarksProps } from '../types';

export function useMarks(
	props: WordPressComponentProps< MarksProps, 'input', false >
) {
	const {
		className,
		marks = false,
		min = 0,
		max = 100,
		step: stepProp = 1,
		value = 0,
		...otherProps
	} = useContextSystem( props, 'Marks' );

	const step = stepProp === 'any' ? 1 : stepProp;
	const marksData = useMarksData( { marks, min, max, step, value } );

	// Generate dynamic class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.marks, className );
	}, [ className, cx ] );

	return {
		...otherProps,
		className: classes,
		marksData,
	};
}
