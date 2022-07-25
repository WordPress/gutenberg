/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectGroupLabel } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlGroupLabel } from './hook';
import type { WordPressComponentProps } from '../../ui/context';
import type { SelectControlGroupLabelProps } from '../types';

const UnforwardedSelectControlGroupLabel = (
	props: WordPressComponentProps<
		SelectControlGroupLabelProps,
		'div',
		false
	>,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlGroupLabel( props );

	// TODO: investigate incompatibility with the "as" prop.
	return <SelectGroupLabel { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlGroupLabel = forwardRef(
	UnforwardedSelectControlGroupLabel
);

export default SelectControlGroupLabel;
