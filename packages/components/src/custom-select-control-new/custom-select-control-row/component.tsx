/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { SelectRow } from 'ariakit/select';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelectControlRow } from './hook';
import type { WordPressComponentProps } from '../../ui/context';
import type { SelectControlRowProps } from '../types';

const UnforwardedSelectControlRow = (
	props: WordPressComponentProps< SelectControlRowProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const allProps = useSelectControlRow( props );

	return <SelectRow { ...allProps } ref={ forwardedRef } />;
};

// TODO: JSDocs
export const SelectControlRow = forwardRef( UnforwardedSelectControlRow );

export default SelectControlRow;
