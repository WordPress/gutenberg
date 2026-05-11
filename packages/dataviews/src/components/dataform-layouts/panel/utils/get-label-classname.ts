/**
 * External dependencies
 */
import clsx from 'clsx';
import type { LabelPosition } from '../../../../types';

function getLabelClassName(
	labelPosition: LabelPosition,
	showError?: boolean
) {
	return clsx(
		'dataforms-layouts-panel__field-label',
		`dataforms-layouts-panel__field-label--label-position-${ labelPosition }`,
		{ 'has-error': showError }
	);
}

export default getLabelClassName;
