/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectSeparator } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlSeparator } from './hook';
import { WordPressComponentProps } from '../../ui/context';
import type { SelectControlSeparatorProps } from '../types';

const UnforwardedSelectControlSeparator = (
	props: WordPressComponentProps< SelectControlSeparatorProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlSeparator( props );

	return <SelectSeparator { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlSeparator = forwardRef(
	UnforwardedSelectControlSeparator
);

export default SelectControlSeparator;
