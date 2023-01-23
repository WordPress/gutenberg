/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { DimensionControl } from '..';
import sizes from '../sizes';

export default {
	component: DimensionControl,
	title: 'Components (Experimental)/DimensionControl',
};

export const _default = () => {
	const [ size, setSize ] = useState< string | undefined >();
	return (
		<>
			<DimensionControl
				label="Please select a size"
				sizes={ sizes }
				onChange={ ( v ) => setSize( v ) }
			/>
			<div>Selected size: { size ?? '-' }</div>
		</>
	);
};

export const _withSizesProp = () => {
	const [ size, setSize ] = useState< string | undefined >();
	const customSizes = [
		{
			name: 'Tall',
			slug: 'tall',
		},
		{
			name: 'Very Tall',
			slug: 'very-tall',
		},
		{
			name: 'Very Very Tall',
			slug: 'very-very-tall',
		},
	];
	return (
		<>
			<DimensionControl
				label="Please select a size"
				sizes={ customSizes }
				onChange={ ( v ) => setSize( v ) }
			/>
			<div>Selected size: { size ?? '-' }</div>
		</>
	);
};
