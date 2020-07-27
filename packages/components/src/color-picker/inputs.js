/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Flex, FlexBlock, FlexItem } from '../flex';
import SelectControl from '../select-control';
import Input from './input';
import InputGroup from './input-group';
import InputAlpha from './input-alpha';

export class Inputs extends Component {
	constructor( { hsl } ) {
		super( ...arguments );

		const view = hsl.a === 1 ? 'rgb' : 'rgb';
		this.state = { view };

		this.resetDraftValues = this.resetDraftValues.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.normalizeValue = this.normalizeValue.bind( this );
	}

	static getDerivedStateFromProps( props, state ) {
		if ( props.hsl.a !== 1 && state.view === 'hex' ) {
			return { view: 'rgb' };
		}
		return null;
	}

	resetDraftValues() {
		return this.props.onChange( {
			state: 'reset',
		} );
	}

	normalizeValue( valueKey, value ) {
		if ( valueKey !== 'a' ) {
			return value;
		}

		if ( value < 0 ) {
			return 0;
		} else if ( value > 1 ) {
			return 1;
		}
		return Math.round( value * 100 ) / 100;
	}

	handleChange( { source, state, value, valueKey } ) {
		this.props.onChange( {
			source,
			state,
			valueKey,
			value: this.normalizeValue( valueKey, value ),
		} );
	}

	renderFields() {
		const { disableAlpha = false } = this.props;
		if ( this.state.view === 'hex' ) {
			return (
				<div className="components-color-picker__inputs-fields">
					<Input
						label={ __( 'Hex' ) }
						hideLabelFromVision
						source={ this.state.view }
						valueKey="hex"
						value={ this.props.hex }
						onChange={ this.handleChange }
						type="text"
					/>
				</div>
			);
		} else if ( this.state.view === 'rgb' ) {
			const legend = disableAlpha
				? __( 'Color value in RGB' )
				: __( 'Color value in RGBA' );
			return (
				<InputGroup legend={ legend }>
					<Input
						source={ this.state.view }
						label={ __( 'red' ) }
						labelText="R"
						valueKey="r"
						value={ this.props.rgb.r }
						onChange={ this.handleChange }
						max="255"
					/>
					<Input
						source={ this.state.view }
						label={ __( 'green' ) }
						labelText="G"
						valueKey="g"
						value={ this.props.rgb.g }
						onChange={ this.handleChange }
						max="255"
					/>
					<Input
						source={ this.state.view }
						label={ __( 'blue' ) }
						labelText="B"
						valueKey="b"
						value={ this.props.rgb.b }
						onChange={ this.handleChange }
						max="255"
					/>
					{ disableAlpha ? null : (
						<InputAlpha
							source={ this.state.view }
							value={ this.props.rgb.a }
							onChange={ this.handleChange }
						/>
					) }
				</InputGroup>
			);
		} else if ( this.state.view === 'hsl' ) {
			const legend = disableAlpha
				? __( 'Color value in HSL' )
				: __( 'Color value in HSLA' );
			return (
				<InputGroup legend={ legend }>
					<Input
						source={ this.state.view }
						label={ __( 'hue' ) }
						labelText="H"
						valueKey="h"
						value={ this.props.hsl.h }
						onChange={ this.handleChange }
						max="359"
					/>
					<Input
						source={ this.state.view }
						label={ __( 'saturation' ) }
						labelText="S"
						valueKey="s"
						value={ this.props.hsl.s }
						onChange={ this.handleChange }
						max="100"
					/>
					<Input
						source={ this.state.view }
						label={ __( 'lightness' ) }
						labelText="L"
						valueKey="l"
						value={ this.props.hsl.l }
						onChange={ this.handleChange }
						max="100"
					/>
					{ disableAlpha ? null : (
						<InputAlpha
							source={ this.state.view }
							value={ this.props.hsl.a }
							onChange={ this.handleChange }
						/>
					) }
				</InputGroup>
			);
		}
	}

	render() {
		return (
			<Flex
				className="components-color-picker__inputs-wrapper"
				align="top"
			>
				<FlexItem className="components-color-picker__inputs-toggle-wrapper">
					<SelectControl
						value={ this.state.view }
						onChange={ ( next ) => {
							this.setState( { view: next } );
							this.resetDraftValues();
						} }
						options={ [
							{ value: 'rgb', label: 'RGB' },
							{ value: 'hsl', label: 'HSL' },
							{ value: 'hex', label: 'Hex' },
						] }
					/>
				</FlexItem>
				<FlexBlock>{ this.renderFields() }</FlexBlock>
			</Flex>
		);
	}
}

export default Inputs;
