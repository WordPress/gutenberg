/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { boolean, number, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RangeControl from '../index';
import { COLORS } from '../../utils';

export default { title: 'Components/RangeControl', component: RangeControl };

const RangeControlWithState = ( props ) => {
	const initialValue = props.value === undefined ? 5 : props.value;
	const [ value, setValue ] = useState( initialValue );

	return <RangeControl { ...props } value={ value } onChange={ setValue } />;
};

const DefaultExample = () => {
	const [ value, setValue ] = useState( undefined );

	const props = {
		afterIcon: text( 'afterIcon', '' ),
		allowReset: boolean( 'allowReset', false ),
		beforeIcon: text( 'beforeIcon', '' ),
		color: text( 'color', COLORS.ui.theme ),
		disabled: boolean( 'disabled', false ),
		help: text( 'help', '' ),
		label: text( 'label', 'Range Label' ),
		marks: boolean( 'marks', false ),
		max: number( 'max', 100 ),
		min: number( 'min', 0 ),
		showTooltip: boolean( 'showTooltip', false ),
		step: number( 'step', 1 ),
		railColor: text( 'railColor', null ),
		trackColor: text( 'trackColor', null ),
		withInputField: boolean( 'withInputField', true ),
		value,
		onChange: setValue,
	};

	return (
		<Wrapper>
			<RangeControl { ...props } />
		</Wrapper>
	);
};

const RangeControlLabeledByMarksType = ( props ) => {
	const label = Array.isArray( props.marks ) ? 'Custom' : 'Automatic';
	return <RangeControl { ...{ ...props, label } } />;
};

export const _default = () => {
	return <DefaultExample />;
};

export const InitialValueZero = () => {
	const label = text( 'Label', 'How many columns should this use?' );

	return (
		<RangeControlWithState
			initialPosition={ 0 }
			label={ label }
			max={ 20 }
			min={ 0 }
			value={ null }
		/>
	);
};

export const withHelp = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const help = text(
		'Help Text',
		'Please select the number of columns you would like this to contain.'
	);

	return <RangeControlWithState label={ label } help={ help } />;
};

export const withMinimumAndMaximumLimits = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const min = number( 'Min Value', 2 );
	const max = number( 'Max Value', 10 );

	return <RangeControlWithState label={ label } min={ min } max={ max } />;
};

export const withIconBefore = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const icon = text( 'Icon', 'wordpress' );

	return <RangeControlWithState label={ label } beforeIcon={ icon } />;
};

export const withIconAfter = () => {
	const label = text( 'Label', 'How many columns should this use?' );
	const icon = text( 'Icon', 'wordpress' );

	return <RangeControlWithState label={ label } afterIcon={ icon } />;
};

export const withReset = () => {
	const label = text( 'Label', 'How many columns should this use?' );

	return <RangeControlWithState label={ label } allowReset />;
};

export const marks = () => {
	const marksBase = [
		{ value: 0, label: '0' },
		{ value: 1, label: '1' },
		{ value: 2, label: '2' },
		{ value: 8, label: '8' },
		{ value: 10, label: '10' },
	];
	const marksWithDecimal = [
		...marksBase,
		{ value: 3.5, label: '3.5' },
		{ value: 5.8, label: '5.8' },
	];
	const marksWithNegatives = [
		...marksBase,
		{ value: -1, label: '-1' },
		{ value: -2, label: '-2' },
		{ value: -4, label: '-4' },
		{ value: -8, label: '-8' },
	];
	const stepInteger = { min: 0, max: 10, step: 1 };
	const stepDecimal = { min: 0, max: 10, step: 0.1 };
	const minNegative = { min: -10, max: 10, step: 1 };
	const rangeNegative = { min: -10, max: -1, step: 1 };

	// use a short alias to keep formatting to fewer lines
	const Range = RangeControlLabeledByMarksType;

	return (
		<Wrapper>
			<h2>Integer Step</h2>
			<Range marks { ...stepInteger } />
			<Range marks={ marksBase } { ...stepInteger } />

			<h2>Decimal Step</h2>
			<Range marks { ...stepDecimal } />
			<Range marks={ marksWithDecimal } { ...stepDecimal } />

			<h2>Negative Minimum</h2>
			<Range marks { ...minNegative } />
			<Range marks={ marksWithNegatives } { ...minNegative } />

			<h2>Negative Range</h2>
			<Range marks { ...rangeNegative } />
			<Range marks={ marksWithNegatives } { ...rangeNegative } />
		</Wrapper>
	);
};

export const multiple = () => {
	return (
		<Wrapper>
			<RangeControlWithState />
			<RangeControlWithState />
			<RangeControlWithState />
			<RangeControlWithState />
		</Wrapper>
	);
};

const Wrapper = styled.div`
	padding: 60px 40px;
`;
