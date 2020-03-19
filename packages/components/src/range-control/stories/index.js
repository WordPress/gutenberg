/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { boolean, number, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RangeControl from '../index';

export default { title: 'Components/RangeControl', component: RangeControl };

const RangeControlWithState = ( props ) => {
	const initialValue = props.value === undefined ? 5 : props.value;
	const [ value, setValue ] = useState( initialValue );

	return <RangeControl { ...props } value={ value } onChange={ setValue } />;
};

const DefaultExample = () => {
	const [ isRtl, setIsRtl ] = useState( false );
	const [ value, setValue ] = useState( undefined );

	const props = {
		allowReset: boolean( 'allowReset', false ),
		disabled: boolean( 'disabled', false ),
		label: text( 'label', 'Range Label' ),
		help: text( 'help', '' ),
		min: number( 'min', 0 ),
		max: number( 'max', 10 ),
		step: number( 'step', 1 ),
		marks: boolean( 'marks', false ),
		showTooltip: boolean( 'showTooltip', false ),
		beforeIcon: text( 'beforeIcon', '' ),
		afterIcon: text( 'afterIcon', '' ),
		withInputField: boolean( 'withInputField', true ),
		value,
		onChange: setValue,
	};

	const rtl = boolean( 'RTL', false );

	useEffect( () => {
		if ( rtl !== isRtl ) {
			setIsRtl( rtl );
		}
	}, [ rtl, isRtl ] );

	useEffect( () => {
		if ( isRtl ) {
			document.documentElement.setAttribute( 'dir', 'rtl' );
		} else {
			document.documentElement.setAttribute( 'dir', 'ltr' );
		}

		return () => {
			document.documentElement.setAttribute( 'dir', 'ltr' );
		};
	}, [ isRtl ] );

	return (
		<Wrapper>
			<RangeControl { ...props } />
		</Wrapper>
	);
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

export const customMarks = () => {
	const marks = [
		{
			value: 0,
			label: '0',
		},
		{
			value: 1,
			label: '1',
		},
		{
			value: 2,
			label: '2',
		},
		{
			value: 8,
			label: '8',
		},
		{
			value: 10,
			label: '10',
		},
	];

	return (
		<Wrapper>
			<RangeControl marks={ marks } min={ 0 } max={ 10 } step={ 1 } />
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
