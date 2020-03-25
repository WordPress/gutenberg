/**
 * External dependencies
 */
import { number, select } from '@storybook/addon-knobs';
/**
 * WordPress dependencies
 */
import { Icon as BaseIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import AlignmentMatrixControl from '../';
import { ALIGNMENT_VALUES } from '../utils';

const alignmentOptions = ALIGNMENT_VALUES.reduce( ( options, item ) => {
	return { ...options, [ item ]: item };
}, {} );

export default {
	title: 'Components/AlignmentMatrixControl',
	component: AlignmentMatrixControl,
};

export const _default = () => {
	return <AlignmentMatrixControl />;
};

export const icon = () => {
	const props = {
		value: select( 'value', alignmentOptions, 'center' ),
		size: number( 'size', 24 ),
	};

	return (
		<>
			<BaseIcon icon={ AlignmentMatrixControl.icon } { ...props } />
		</>
	);
};
