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
import Visualizer from './visualizer';
import Tooltip from '../tooltip';
import BaseUnitControl from '../unit-control';
import { Flex, FlexBlock, FlexItem } from '../flex';
import {
	DEFAULT_VALUES,
	TYPE_PROPS,
	parseValues,
	parseType,
	getValues,
} from './utils';

const defaultInputProps = {
	min: 0,
};

const BoxControlComponent = {
	all: BoxAllControl,
	pairs: BoxPairsControl,
	custom: BoxCustomControl,
};

export default function BoxControl( {
	inputProps = defaultInputProps,
	onChange = noop,
	onSelect = noop,
	label = __( 'Box Control' ),
	values: valuesProp = DEFAULT_VALUES,
	// Disable units for now
	units = false,
} ) {
	const [ type, setType ] = useState( parseType( valuesProp ) );
	const [ values, setValues ] = useState( parseValues( valuesProp ) );
	const [ icon, setIcon ] = useState( parseType( valuesProp ) );
	const ControlComponent = BoxControlComponent[ type ];

	const updateValues = ( nextValues ) => {
		const mergedValues = { ...values, ...nextValues };
		setValues( mergedValues );
		onChange( mergedValues );
	};

	const handleOnSelect = ( next ) => {
		let nextSelect = [ next ];

		switch ( next ) {
			case 'all':
				nextSelect = [ 'top', 'right', 'bottom', 'left' ];
				break;
			case 'vertical':
				nextSelect = [ 'top', 'bottom' ];
				break;
			case 'horizontal':
				nextSelect = [ 'right', 'left' ];
				break;
			case 'pairs':
				nextSelect = [ 'top', 'bottom' ];
				break;
			case 'custom':
				nextSelect = [ 'top' ];
				break;
		}

		onSelect( nextSelect );
	};

	const mixedLabel = __( 'Mixed' );

	return (
		<Root>
			<Header>
				<FlexItem>{ label }</FlexItem>
			</Header>
			{ false && (
				<Flex align="top" gap={ 1 }>
					<FlexItem>
						<BoxTypeDropdown
							icon={ icon }
							label={ label }
							onChange={ ( next ) => {
								setType( next );
								handleOnSelect( next );
							} }
							onSelect={ setIcon }
							type={ type }
						/>
					</FlexItem>
					<FlexBlock>
						<ControlComponent
							{ ...inputProps }
							placeholder={ mixedLabel }
							values={ values }
							onSelect={ ( next ) => {
								handleOnSelect( next );
								setIcon( next );
							} }
							onChange={ updateValues }
							units={ units }
						/>
					</FlexBlock>
				</Flex>
			) }
			<LayoutContainer>
				<BoxUIControl
					{ ...inputProps }
					placeholder={ mixedLabel }
					values={ values }
					onSelect={ ( next ) => {
						handleOnSelect( next );
						setIcon( next );
					} }
					onChange={ updateValues }
					units={ units }
				/>
			</LayoutContainer>
		</Root>
	);
}

function BoxUIControl( { onChange = noop, values, ...props } ) {
	const {
		top: [ top, unit ],
		right: [ right ],
		bottom: [ bottom ],
		left: [ left ],
	} = values;

	const allValues = getValues( values, 'top', 'right', 'bottom', 'left' );
	const isMixed = ! allValues.every( ( v ) => v === top );

	const createHandleOnChange = ( side ) => ( next ) => {
		onChange( { ...values, [ side ]: [ next, unit ] } );
	};

	const baseStyles = {
		position: 'absolute',
		zIndex: 1,
		maxWidth: 50,
	};

	return (
		<GridUI>
			<GridIndicator
				style={ {
					left: '50%',
					top: '50%',
					transform: 'translate(0, -30px)',
				} }
			/>
			<GridIndicator
				style={ {
					left: '50%',
					bottom: '50%',
					transform: 'translate(0, 30px)',
				} }
			/>
			<GridIndicator
				style={ {
					left: '50%',
					top: '50%',
					transform: 'rotate(-90deg) translate(7px, -38px)',
				} }
			/>
			<GridIndicator
				style={ {
					right: '50%',
					top: '50%',
					transform: 'rotate(-90deg) translate(7px, 38px)',
				} }
			/>

			<UnitControl
				{ ...props }
				disableUnits
				value={ top }
				onChange={ createHandleOnChange( 'top' ) }
				placeholder="Top"
				label="Top"
				size="small"
				style={ {
					...baseStyles,
					left: '50%',
					top: 0,
					transform: 'translateX(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				disableUnits
				value={ right }
				onChange={ createHandleOnChange( 'right' ) }
				placeholder="Right"
				label="Right"
				size="small"
				style={ {
					...baseStyles,
					right: 0,
					top: '50%',
					transform: 'translateY(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				disableUnits
				value={ bottom }
				onChange={ createHandleOnChange( 'bottom' ) }
				placeholder="Bottom"
				label="Bottom"
				size="small"
				style={ {
					...baseStyles,
					left: '50%',
					bottom: 0,
					transform: 'translateX(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				disableUnits
				value={ left }
				onChange={ createHandleOnChange( 'left' ) }
				placeholder="Left"
				label="Left"
				size="small"
				style={ {
					...baseStyles,
					position: 'absolute',
					left: 0,
					top: '50%',
					transform: 'translateY(-50%)',
				} }
			/>
			<UnitControl
				{ ...props }
				disableUnits
				value={ isMixed ? '' : top }
				onChange={ ( next ) => {
					onChange( {
						top: [ next, unit ],
						right: [ next, unit ],
						bottom: [ next, unit ],
						left: [ next, unit ],
					} );
				} }
				placeholder="All"
				label="All"
				size="small"
				style={ {
					...baseStyles,
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
				} }
			/>
		</GridUI>
	);
}

function BoxAllControl( {
	placeholder,
	onSelect = noop,
	onChange = noop,
	values,
	...props
} ) {
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
					onFocus={ () => onSelect( 'all' ) }
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
		<div>
			<ControlContainer style={ { marginBottom: 2 } }>
				<FlexItem>
					<UnitControl
						{ ...unitControlProps.top }
						{ ...props }
						label={ labels.top }
						onFocus={ () => handleOnSelect( 'top' ) }
						placeholder=""
					/>
				</FlexItem>
				<FlexItem>
					<UnitControl
						{ ...unitControlProps.right }
						{ ...props }
						label={ labels.right }
						onFocus={ () => handleOnSelect( 'right' ) }
						placeholder=""
					/>
				</FlexItem>
			</ControlContainer>
			<ControlContainer isReversed>
				<FlexItem>
					<UnitControl
						{ ...unitControlProps.bottom }
						{ ...props }
						label={ labels.bottom }
						onFocus={ () => handleOnSelect( 'bottom' ) }
						placeholder=""
					/>
				</FlexItem>
				<FlexItem>
					<UnitControl
						{ ...unitControlProps.left }
						{ ...props }
						label={ labels.left }
						onFocus={ () => handleOnSelect( 'left' ) }
						placeholder=""
					/>
				</FlexItem>
			</ControlContainer>
		</div>
	);
}

function ControlContainer( { children, ...props } ) {
	return (
		<Flex align="top" justify="left" gap={ 0.5 } { ...props }>
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

function BoxTypeDropdown( { onChange = noop, onSelect = noop, icon, type } ) {
	const icons = {
		all: <BoxControlIcon sides={ TYPE_PROPS.all.sides } />,
		pairs: <BoxControlIcon sides={ TYPE_PROPS.pairs.sides } />,
		custom: <BoxControlIcon sides={ TYPE_PROPS.custom.sides } />,
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
			title: TYPE_PROPS.all.label,
			value: 'all',
			icon: <DropdownIconWrapper>{ icons.all }</DropdownIconWrapper>,
			onClick: () => handleOnChange( 'all' ),
			isActive: type === 'all',
		},
		{
			title: TYPE_PROPS.pairs.label,
			value: 'pairs',
			icon: <DropdownIconWrapper>{ icons.pairs }</DropdownIconWrapper>,
			onClick: () => handleOnChange( 'pairs' ),
			isActive: type === 'pairs',
		},
		{
			title: TYPE_PROPS.custom.label,
			value: 'custom',
			icon: <DropdownIconWrapper>{ icons.custom }</DropdownIconWrapper>,
			onClick: () => handleOnChange( 'custom' ),
			isActive: type === 'custom',
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
		isSmall: true,
		style: {
			height: 30,
			lineHeight: 28,
		},
	};

	return (
		<DropdownMenu
			controls={ options }
			icon={ null }
			popoverProps={ { position: 'bottom' } }
			toggleProps={ toggleProps }
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
// 				const valueProps = TYPE_PROPS[ value ];
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
	margin: 0 -4px;
`;

const DropdownIconWrapper = styled.div`
	margin-right: 8px;
`;

const LayoutContainer = styled( Flex )`
	height: 120px;
	justify-content: center;
	padding-bottom: 16px;
`;

const GridUI = styled.div`
	position: relative;
	height: 120px;
	width: 200px;
`;

const GridIndicator = styled.div`
	height: 14px;
	border-left: 1px dashed dodgerblue;
	width: 0;
	position: absolute;

	&::before {
		content: '';
		position: absolute;
		width: 7px;
		height: 0;
		border-top: 1px dashed dodgerblue;
		top: 0;
		left: -4px;
	}
	&::after {
		content: '';
		position: absolute;
		width: 7px;
		height: 0;
		border-top: 1px dashed dodgerblue;
		bottom: 0;
		left: -4px;
	}
`;

BoxControl.__Visualizer = Visualizer;
