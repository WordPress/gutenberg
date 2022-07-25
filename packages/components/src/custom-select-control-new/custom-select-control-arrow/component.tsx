/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectArrow } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlArrow } from './hook';
import type { WordPressComponentProps } from '../../ui/context';
import type { SelectControlArrowProps } from '../types';

const UnforwardedSelectControlArrow = (
	props: WordPressComponentProps< SelectControlArrowProps, 'span', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlArrow( props );

	// TODO: investigate incompatibility with the "as" prop.
	return <SelectArrow { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlArrow = forwardRef( UnforwardedSelectControlArrow );

export default SelectControlArrow;
