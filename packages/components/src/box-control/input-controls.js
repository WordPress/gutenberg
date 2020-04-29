/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import UnitControl from './unit-control';
import { LABELS, getAllValue, useBoxControlState } from './utils';
import {
	LayoutContainer,
	Layout,
	LayoutBox,
} from './styles/box-control-styles';
import { useRtl } from '../utils/style-mixins';

export default function BoxInputControls( {
	isLinked = true,
	isInline = false,
	onChange = noop,
	values: valuesProp,
	...props
} ) {
	const [ values, setValues ] = useBoxControlState( valuesProp );

	const handleOnChange = ( nextValues ) => {
		setValues( nextValues );
		onChange( nextValues );
	};

	const { top, right, bottom, left } = values;

	const isRtl = useRtl();
	const allValue = getAllValue( values );
	const allPlaceholder = isNaN( parseFloat( allValue ) )
		? LABELS.mixed
		: null;

	const createHandleOnChange = ( side ) => ( next, { event } ) => {
		const { altKey } = event;
		const nextValues = { ...values };

		if ( side === 'all' ) {
			nextValues.top = next;
			nextValues.bottom = next;
			nextValues.left = next;
			nextValues.right = next;
		} else {
			nextValues[ side ] = next;
		}

		/**
		 * Supports changing pair sides. For example, holding the ALT key
		 * when changing the TOP will also update BOTTOM.
		 */
		if ( altKey ) {
			switch ( side ) {
				case 'top':
					nextValues.bottom = next;
					break;
				case 'bottom':
					nextValues.top = next;
					break;
				case 'left':
					nextValues.right = next;
					break;
				case 'right':
					nextValues.left = next;
					break;
			}
		}

		handleOnChange( nextValues );
	};

	/**
	 * All sides
	 */
	if ( isLinked ) {
		return (
			<UnitControl
				{ ...props }
				value={ allValue }
				onChange={ createHandleOnChange( 'all' ) }
				placeholder={ allPlaceholder }
				style={ { position: 'relative' } }
			/>
		);
	}

	/**
	 * TODO: REMOVE THIS
	 * Just for testing inline UI
	 */
	if ( isInline ) {
		return (
			<LayoutContainer className="component-box-control__input-controls-wrapper">
				<Layout
					gap={ 1 }
					align="top"
					isInline={ isInline }
					className="component-box-control__input-controls"
				>
					<UnitControl
						{ ...props }
						value={ top }
						isInline={ isInline }
						onChange={ createHandleOnChange( 'top' ) }
						label={ LABELS.top }
					/>

					<UnitControl
						{ ...props }
						value={ right }
						isInline={ isInline }
						onChange={ createHandleOnChange( 'right' ) }
						label={ LABELS.right }
					/>
					<UnitControl
						{ ...props }
						value={ bottom }
						isInline={ isInline }
						onChange={ createHandleOnChange( 'bottom' ) }
						label={ LABELS.bottom }
					/>
					<UnitControl
						{ ...props }
						value={ left }
						isInline={ isInline }
						onChange={ createHandleOnChange( 'left' ) }
						label={ LABELS.left }
					/>
				</Layout>
			</LayoutContainer>
		);
	}

	/**
	 * Individual sides
	 */
	return (
		<LayoutContainer className="component-box-control__input-controls-wrapper">
			<Layout
				gap={ 1 }
				align="top"
				className="component-box-control__input-controls"
			>
				<LayoutBox aria-hidden="true" />
				<UnitControl
					{ ...props }
					value={ top }
					dragDirection="s"
					onChange={ createHandleOnChange( 'top' ) }
					label={ LABELS.top }
					style={ {
						marginTop: -7,
						top: 0,
						left: '50%',
						transform: 'translateX(-50%)',
					} }
				/>
				<UnitControl
					{ ...props }
					value={ left }
					dragDirection="e"
					onChange={ createHandleOnChange( 'left' ) }
					label={ LABELS.left }
					style={ {
						[ isRtl ? 'right' : 'left' ]: 0,
						top: '50%',
						transform: 'translateY(-50%)',
					} }
				/>
				<UnitControl
					{ ...props }
					value={ right }
					dragDirection="w"
					onChange={ createHandleOnChange( 'right' ) }
					label={ LABELS.right }
					style={ {
						[ isRtl ? 'left' : 'right' ]: 0,
						top: '50%',
						transform: 'translateY(-50%)',
					} }
				/>
				<UnitControl
					{ ...props }
					value={ bottom }
					dragDirection="n"
					onChange={ createHandleOnChange( 'bottom' ) }
					label={ LABELS.bottom }
					style={ {
						left: '50%',
						bottom: -2,
						transform: 'translateX(-50%)',
					} }
				/>
			</Layout>
		</LayoutContainer>
	);
}
