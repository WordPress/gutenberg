/**
 * External dependencies
 */
import { number, select } from '@storybook/addon-knobs';
/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import AlignmentControl from '../';
import { ALIGNMENT_VALUES } from '../utils';

const alignmentOptions = ALIGNMENT_VALUES.reduce( ( options, item ) => {
	return { ...options, [ item ]: item };
}, {} );

export default {
	title: 'Components/AlignmentControl',
	component: AlignmentControl,
};

export const _default = () => {
	return <AlignmentControl />;
};

export const alignmentControlIcon = () => {
	const props = {
		alignment: select( 'alignment', alignmentOptions, 'center' ),
		size: number( 'size', 24 ),
	};

	return (
		<>
			<Icon icon={ AlignmentControl.icon } { ...props } />
		</>
	);
};
