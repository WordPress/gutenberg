/**
 * External dependencies
 */
import { noop } from 'lodash';
import { useRadioState, Radio, RadioGroup } from 'reakit/Radio';
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import ButtonGroup from '../button-group';
import Button from '../button';
import BoxControlIcon from './icon';
import Tooltip from '../tooltip';
import BaseUnitControl from '../unit-control';
import { Flex, FlexBlock, FlexItem } from '../flex';

const types = [ 'all', 'pairs', 'custom' ];
const defaultInputProps = {
	min: 0,
};

const typeProps = {
	all: {
		sides: [ 'all' ],
		label: __( 'All sides' ),
	},
	pairs: {
		sides: [ 'top', 'bottom' ],
		label: __( 'Pair of sides' ),
	},
	custom: {
		sides: [ 'top' ],
		label: __( 'Individual sides' ),
	},
};

const defaultValueProps = {
	top: [ 0, 'px' ],
	right: [ 0, 'px' ],
	bottom: [ 0, 'px' ],
	left: [ 0, 'px' ],
};

const BoxControlComponent = {
	all: BoxAllControl,
	pairs: BoxPairsControl,
	custom: BoxCustomControl,
};

const parseType = ( type ) => {
	return types.includes( type ) ? type : 'all';
};

export default function BoxControl( {
	inputProps = defaultInputProps,
	onChange = noop,
	label = __( 'Box Control' ),
	type: typeProp = 'pairs',
	values: valuesProp,
	// Disable units for now
	units = false,
} ) {
	const [ type, setType ] = useState( parseType( typeProp ) );
	const [ values, setValues ] = useState( parseValues( valuesProp ) );
	const ControlComponent = BoxControlComponent[ type ];

	const updateValues = ( nextValues ) => {
		const mergedValues = { ...values, ...nextValues };
		setValues( mergedValues );
		onChange( mergedValues );
	};

	const mixedLabel = __( 'Mixed' );

	return (
		<Root>
			<Header>
				<FlexItem>{ label }</FlexItem>
				<FlexItem>
					<BoxTypeControl
						label={ label }
						onChange={ setType }
						type={ type }
					/>
				</FlexItem>
			</Header>
			<ControlComponent
				{ ...inputProps }
				placeholder={ mixedLabel }
				values={ values }
				onChange={ updateValues }
				units={ units }
			/>
		</Root>
	);
}

function BoxAllControl( { placeholder, onChange = noop, values, ...props } ) {
	const [ value, unit ] = values.top;
	const allValues = getValues( values, 'top', 'right', 'bottom', 'left' );
	const isMixed = ! allValues.every( ( v ) => v === value );

	return (
		<ControlContainer>
			<IconWrapper>
				<BoxControlIcon />
			</IconWrapper>
			<FlexBlock>
				<UnitControl
					{ ...props }
					label={ __( 'All Sides' ) }
					value={ isMixed ? '' : value }
					placeholder={ placeholder }
					unit={ unit }
					onChange={ ( next ) => {
						onChange( {
							top: [ next, unit ],
							right: [ next, unit ],
							bottom: [ next, unit ],
							left: [ next, unit ],
						} );
					} }
					onUnitChange={ ( next ) => {
						onChange( {
							top: [ value, next ],
							right: [ value, next ],
							bottom: [ value, next ],
							left: [ value, next ],
						} );
					} }
				/>
			</FlexBlock>
		</ControlContainer>
	);
}

function BoxPairsControl( { placeholder, onChange = noop, values, ...props } ) {
	const [ selected, setSelected ] = useState( 'vertical' );
	const [ vertical, verticalUnit ] = values.top;
	const [ horizontal, horizontalUnit ] = values.left;

	const isVerticalMixed = ! getValues( values, 'top', 'bottom' ).every(
		( v ) => v === vertical
	);
	const isHorizontalMixed = ! getValues( values, 'left', 'right' ).every(
		( v ) => v === horizontal
	);

	const iconSides = {
		vertical: [ 'top', 'bottom' ],
		horizontal: [ 'left', 'right' ],
	};

	const iconSide = iconSides[ selected ];

	return (
		<ControlContainer>
			<IconWrapper>
				<BoxControlIcon sides={ iconSide } />
			</IconWrapper>
			<UnitControl
				{ ...props }
				label={ __( 'Left/Right' ) }
				placeholder={ placeholder }
				onFocus={ () => setSelected( 'vertical' ) }
				onChange={ ( next ) => {
					onChange( {
						top: [ next, verticalUnit ],
						bottom: [ next, verticalUnit ],
					} );
				} }
				onUnitChange={ ( next ) => {
					onChange( {
						top: [ vertical, next ],
						bottom: [ vertical, next ],
					} );
				} }
				value={ isVerticalMixed ? '' : vertical }
				unit={ verticalUnit }
			/>
			<UnitControl
				{ ...props }
				label={ __( 'Top/Bottom' ) }
				placeholder={ placeholder }
				onFocus={ () => setSelected( 'horizontal' ) }
				onChange={ ( next ) => {
					onChange( {
						left: [ next, horizontalUnit ],
						right: [ next, horizontalUnit ],
					} );
				} }
				onUnitChange={ ( next ) => {
					onChange( {
						left: [ horizontal, next ],
						right: [ horizontal, next ],
					} );
				} }
				value={ isHorizontalMixed ? '' : horizontal }
				unit={ horizontalUnit }
			/>
		</ControlContainer>
	);
}

function BoxCustomControl( { onChange = noop, values, ...props } ) {
	const [ selected, setSelected ] = useState( 'top' );
	const unitControlProps = useCustomUnitControlProps( {
		values,
		onChange,
	} );

	return (
		<ControlContainer>
			<IconWrapper>
				<BoxControlIcon sides={ [ selected ] } />
			</IconWrapper>
			<ControlContainer>
				<UnitControl
					{ ...unitControlProps.top }
					{ ...props }
					label={ __( 'Top' ) }
					onFocus={ () => setSelected( 'top' ) }
					placeholder=""
				/>
				<UnitControl
					{ ...unitControlProps.right }
					{ ...props }
					label={ __( 'Right' ) }
					onFocus={ () => setSelected( 'right' ) }
					placeholder=""
				/>
				<UnitControl
					{ ...unitControlProps.bottom }
					{ ...props }
					label={ __( 'Bottom' ) }
					onFocus={ () => setSelected( 'bottom' ) }
					placeholder=""
				/>
				<UnitControl
					{ ...unitControlProps.left }
					{ ...props }
					label={ __( 'Left' ) }
					onFocus={ () => setSelected( 'left' ) }
					placeholder=""
				/>
			</ControlContainer>
		</ControlContainer>
	);
}

function ControlContainer( { children } ) {
	return (
		<Flex justify="left" gap={ 1 }>
			{ children }
		</Flex>
	);
}

function useCustomUnitControlProps( { values, onChange = noop } ) {
	const valueKeys = Object.keys( values );
	const props = {};

	valueKeys.forEach( ( key ) => {
		const [ value, unit ] = values[ key ];

		const handleOnChange = ( next ) => {
			onChange( { [ key ]: [ next, unit ] } );
		};

		const handleOnUnitChange = ( next ) => {
			onChange( { [ key ]: [ value, next ] } );
		};

		props[ key ] = {
			value,
			unit,
			onChange: handleOnChange,
			onUnitChange: handleOnUnitChange,
		};
	} );

	return props;
}

function BoxTypeControl( {
	label = 'Box Control',
	onChange = noop,
	type = 'all',
} ) {
	const radio = useRadioState( { state: type } );

	useEffect( () => {
		onChange( radio.state );
	}, [ radio.state ] );

	return (
		<RadioGroup { ...radio } as={ ButtonGroup } aria-label={ label }>
			{ types.map( ( value ) => {
				const valueProps = typeProps[ value ];
				const isSelected = radio.state === value;

				return (
					<Tooltip key={ value } text={ valueProps.label }>
						<Radio
							{ ...radio }
							as={ Button }
							isPrimary={ isSelected }
							value={ value }
						>
							<BoxControlIcon sides={ valueProps.sides } />
						</Radio>
					</Tooltip>
				);
			} ) }
		</RadioGroup>
	);
}

function UnitControl( { label, ...props } ) {
	return (
		<Tooltip text={ label }>
			<UnitControlWrapper aria-label={ label }>
				<BaseUnitControl
					isResetValueOnUnitChange={ false }
					{ ...props }
				/>
			</UnitControlWrapper>
		</Tooltip>
	);
}

const Root = styled.div`
	max-width: 400px;
`;

const Header = styled( Flex )`
	margin-bottom: 8px;
`;

const IconWrapper = styled( FlexItem )`
	padding-right: 8px;
`;

const UnitControlWrapper = styled.div`
	box-sizing: border-box;
	max-width: 70px;
`;

function parseValues( values = {} ) {
	const nextValueProps = {};

	Object.keys( defaultValueProps ).forEach( ( key ) => {
		const defaultValue = defaultValueProps[ key ];
		const prop = values[ key ] || [];

		nextValueProps[ key ] = [
			prop?.[ 0 ] || defaultValue[ 0 ],
			prop?.[ 1 ] || defaultValue[ 1 ],
		];
	} );

	return nextValueProps;
}

function getValues( values, ...args ) {
	const nextValues = [];
	args.forEach( ( key ) => {
		nextValues.push( values[ key ][ 0 ] );
	} );

	return nextValues;
}
