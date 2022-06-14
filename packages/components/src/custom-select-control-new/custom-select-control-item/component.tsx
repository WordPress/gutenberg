/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectItem } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlItem } from './hook';
import { WordPressComponentProps } from '../../ui/context';
import type { SelectControlItemProps } from '../types';

const UnforwardedSelectControlItem = (
	props: WordPressComponentProps< SelectControlItemProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlItem( props );

	// TODO: investigate incompatibility with the "as" prop.
	return <SelectItem { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlItem = forwardRef( UnforwardedSelectControlItem );

export default SelectControlItem;
