/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectItemCheck } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlItemCheck } from './hook';
import type { WordPressComponentProps } from '../../ui/context';
import type { SelectControlItemCheckProps } from '../types';

const UnforwardedSelectControlItemCheck = (
	props: WordPressComponentProps<
		SelectControlItemCheckProps,
		'span',
		false
	>,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlItemCheck( props );

	return <SelectItemCheck { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlItemCheck = forwardRef(
	UnforwardedSelectControlItemCheck
);

export default SelectControlItemCheck;
