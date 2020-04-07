/**
 * External dependencies
 */
import { noop } from 'lodash';
// import { useRadioState, Radio, RadioGroup } from 'reakit/Radio';
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, chevronDown } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
// import BaseButtonGroup from '../button-group';
import DropdownMenu from '../dropdown-menu';
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
	type: typeProp = 'all',
	values: valuesProp,
	// Disable units for now
	units = false,
} ) {
	const [ type, setType ] = useState( parseType( typeProp ) );
	const [ values, setValues ] = useState( parseValues( valuesProp ) );
	const [ icon, setIcon ] = useState( parseType( typeProp ) );
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
			</Header>
			<Flex gap={ 1 }>
				<FlexItem>
					<BoxTypeDropdown
						icon={ icon }
						label={ label }
						onChange={ setType }
						onSelect={ setIcon }
						type={ type }
					/>
				</FlexItem>
				<FlexBlock>
					<ControlComponent
						{ ...inputProps }
						placeholder={ mixedLabel }
						values={ values }
						onSelect={ setIcon }
						onChange={ updateValues }
						units={ units }
					/>
				</FlexBlock>
			</Flex>
		</Root>
	);
}

function BoxAllControl( { placeholder, onChange = noop, values, ...props } ) {
	const [ value, unit ] = values.top;
	const allValues = getValues( values, 'top', 'right', 'bottom', 'left' );
	const isMixed = ! allValues.every( ( v ) => v === value );

	const placeholderLabel = typeof value === 'number' ? placeholder : null;

	return (
		<ControlContainer>
			<FlexBlock>
				<UnitControl
					{ ...props }
					label={ __( 'All Sides' ) }
					value={ isMixed ? '' : value }
					placeholder={ placeholderLabel }
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

function BoxPairsControl( {
	placeholder,
	onChange = noop,
	onSelect = noop,
	values,
	...props
} ) {
	const [ vertical, verticalUnit ] = values.top;
	const [ horizontal, horizontalUnit ] = values.left;

	const isVerticalMixed = ! getValues( values, 'top', 'bottom' ).every(
		( v ) => v === vertical
	);
	const isHorizontalMixed = ! getValues( values, 'left', 'right' ).every(
		( v ) => v === horizontal
	);

	const verticalPlaceholder =
		typeof vertical === 'number' ? placeholder : null;
	const horizontalPlaceholder =
		typeof horizontal === 'number' ? placeholder : null;

	const labels = {
		vertical: __( 'Top/Bottom' ),
		horizontal: __( 'Left/Right' ),
	};

	const handleOnSelect = ( next ) => {
		onSelect( next );
	};

	return (
		<ControlContainer>
			<UnitControl
				{ ...props }
				label={ labels.vertical }
				placeholder={ verticalPlaceholder }
				onFocus={ () => handleOnSelect( 'vertical' ) }
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
				label={ labels.horizontal }
				placeholder={ horizontalPlaceholder }
				onFocus={ () => handleOnSelect( 'horizontal' ) }
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

function BoxCustomControl( {
	onSelect = noop,
	onChange = noop,
	values,
	...props
} ) {
	const unitControlProps = useCustomUnitControlProps( {
		values,
		onChange,
	} );

	const labels = {
		top: __( 'Top' ),
		right: __( 'Right' ),
		bottom: __( 'Bottom' ),
		left: __( 'Left' ),
	};

	const handleOnSelect = ( next ) => {
		onSelect( next );
	};

	return (
		<ControlContainer>
			<UnitControl
				{ ...unitControlProps.top }
				{ ...props }
				label={ labels.top }
				onFocus={ () => handleOnSelect( 'top' ) }
				placeholder=""
			/>
			<UnitControl
				{ ...unitControlProps.right }
				{ ...props }
				label={ labels.right }
				onFocus={ () => handleOnSelect( 'right' ) }
				placeholder=""
			/>
			<UnitControl
				{ ...unitControlProps.bottom }
				{ ...props }
				label={ labels.bottom }
				onFocus={ () => handleOnSelect( 'bottom' ) }
				placeholder=""
			/>
			<UnitControl
				{ ...unitControlProps.left }
				{ ...props }
				label={ labels.left }
				onFocus={ () => handleOnSelect( 'left' ) }
				placeholder=""
			/>
		</ControlContainer>
	);
}

function ControlContainer( { children } ) {
	return (
		<Flex justify="left" gap={ 0.5 }>
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

function BoxTypeDropdown( { onChange = noop, onSelect = noop, icon } ) {
	const icons = {
		all: <BoxControlIcon sides={ typeProps.all.sides } />,
		pairs: <BoxControlIcon sides={ typeProps.pairs.sides } />,
		custom: <BoxControlIcon sides={ typeProps.custom.sides } />,
		vertical: <BoxControlIcon sides={ [ 'top', 'bottom' ] } />,
		horizontal: <BoxControlIcon sides={ [ 'left', 'right' ] } />,
		top: <BoxControlIcon sides={ [ 'top' ] } />,
		right: <BoxControlIcon sides={ [ 'right' ] } />,
		bottom: <BoxControlIcon sides={ [ 'bottom' ] } />,
		left: <BoxControlIcon sides={ [ 'left' ] } />,
	};

	const handleOnChange = ( next ) => {
		onChange( next );
		onSelect( next );
	};

	const options = [
		{
			title: typeProps.all.label,
			value: 'all',
			icon: icons.all,
			onClick: () => handleOnChange( 'all' ),
		},
		{
			title: typeProps.pairs.label,
			value: 'pairs',
			icon: icons.pairs,
			onClick: () => handleOnChange( 'pairs' ),
		},
		{
			title: typeProps.custom.label,
			value: 'custom',
			icon: icons.custom,
			onClick: () => handleOnChange( 'custom' ),
		},
	];

	const dropdownIcon = (
		<DropdownButton gap={ 0 }>
			{ icons[ icon ] }
			<Icon icon={ chevronDown } size={ 16 } />
		</DropdownButton>
	);

	const toggleProps = {
		children: dropdownIcon,
	};

	return (
		<DropdownMenu
			icon={ null }
			toggleProps={ toggleProps }
			controls={ options }
		/>
	);
}

// function BoxTypeControl( {
// 	label = 'Box Control',
// 	onChange = noop,
// 	type = 'all',
// } ) {
// 	const radio = useRadioState( { state: type } );

// 	useEffect( () => {
// 		onChange( radio.state );
// 	}, [ radio.state ] );

// 	return (
// 		<RadioGroup { ...radio } as={ ButtonGroup } aria-label={ label }>
// 			{ types.map( ( value ) => {
// 				const valueProps = typeProps[ value ];
// 				const isSelected = radio.state === value;

// 				return (
// 					<Tooltip key={ value } text={ valueProps.label }>
// 						<Radio
// 							{ ...radio }
// 							as={ Button }
// 							isPrimary={ isSelected }
// 							value={ value }
// 						>
// 							<BoxControlIcon sides={ valueProps.sides } />
// 						</Radio>
// 					</Tooltip>
// 				);
// 			} ) }
// 		</RadioGroup>
// 	);
// }

function UnitControl( { onChange, label, ...props } ) {
	const handleOnChange = ( nextValue ) => {
		const value = parseFloat( nextValue );
		onChange( isNaN( value ) ? nextValue : value );
	};
	return (
		<Tooltip text={ label }>
			<UnitControlWrapper aria-label={ label }>
				<BaseUnitControl
					isResetValueOnUnitChange={ false }
					onChange={ handleOnChange }
					{ ...props }
				/>
			</UnitControlWrapper>
		</Tooltip>
	);
}

const Root = styled.div`
	max-width: 280px;
`;

const Header = styled( Flex )`
	margin-bottom: 8px;
`;

const UnitControlWrapper = styled.div`
	box-sizing: border-box;
	max-width: 75px;
`;

// const ButtonGroup = styled( BaseButtonGroup )`
// 	display: flex;
// 	margin: 0;
// `;

const DropdownButton = styled( Flex )`
	margin: 0 -8px;
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
