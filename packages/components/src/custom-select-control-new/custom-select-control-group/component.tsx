/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectGroup } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlGroup } from './hook';
import { WordPressComponentProps } from '../../ui/context';
import type { SelectControlGroupProps } from '../types';

const UnforwardedSelectControlGroup = (
	props: WordPressComponentProps< SelectControlGroupProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlGroup( props );

	// TODO: investigate incompatibility with the "as" prop.
	return <SelectGroup { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlGroup = forwardRef( UnforwardedSelectControlGroup );

export default SelectControlGroup;
