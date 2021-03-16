/**
 * External dependencies
 */
import { View } from 'react-native';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	PlainText,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Button,
	PanelBody,
	UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { buttonWithIcon, toggleLabel } from './icons';
import ButtonPositionDropdown from './button-position-dropdown';
import styles from './style.scss';
import richTextStyles from './rich-text.scss';
import {
	isPercentageUnit,
	CSS_UNITS,
	MIN_WIDTH,
	PC_WIDTH_DEFAULT,
	PX_WIDTH_DEFAULT,
} from './utils.js';

/**
 * Constants
 */
const MIN_BUTTON_WIDTH = 100;

export default class SearchEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isButtonSelected: false,
			isLabelSelected: false,
			isPlaceholderSelected: false,
		};

		this.onChange = this.onChange.bind( this );
		this.onChangeWidth = this.onChangeWidth.bind( this );
		this.onChangeUnit = this.onChangeUnit.bind( this );
	}

	static getDerivedStateFromProps( props, state ) {
		return {
			isPlaceholderSelected:
				props.isSelected && state.isPlaceholderSelected,
			isButtonSelected: props.isSelected && state.isButtonSelected,
			isLabelSelected: props.isSelected && state.isLabelSelected,
		};
	}

	onChange( nextWidth ) {
		const { widthUnit } = this.props.attributes;
		if ( isPercentageUnit( widthUnit ) || ! widthUnit ) {
			return;
		}
		this.onChangeWidth( nextWidth );
	}

	onChangeWidth( nextWidth ) {
		const { setAttributes, attributes } = this.props;
		const { widthUnit } = attributes;
		setAttributes( {
			width: nextWidth,
			widthUnit,
		} );
	}

	onChangeUnit( nextUnit ) {
		this.props.setAttributes( {
			width: '%' === nextUnit ? PC_WIDTH_DEFAULT : PX_WIDTH_DEFAULT,
			widthUnit: nextUnit,
		} );
	}

	getBlockClassNames() {
		const { className, attributes } = this.props;
		const { buttonPosition, buttonUseIcon } = attributes;

		return classnames(
			className,
			'button-inside' === buttonPosition
				? 'wp-block-search__button-inside'
				: undefined,
			'button-outside' === buttonPosition
				? 'wp-block-search__button-outside'
				: undefined,
			'no-button' === buttonPosition
				? 'wp-block-search__no-button'
				: undefined,
			'button-only' === buttonPosition
				? 'wp-block-search__button-only'
				: undefined,
			! buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__text-button'
				: undefined,
			buttonUseIcon && 'no-button' !== buttonPosition
				? 'wp-block-search__icon-button'
				: undefined
		);
	}

	control() {
		const { attributes, setAttributes } = this.props;
		const {
			showLabel,
			buttonPosition,
			buttonUseIcon,
			widthUnit,
			width,
		} = attributes;
		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							title={ __( 'Toggle search label' ) }
							icon={ toggleLabel }
							onClick={ () => {
								setAttributes( {
									showLabel: ! showLabel,
								} );
							} }
							isActive={ showLabel }
						/>

						<ButtonPositionDropdown
							selectedOption={ buttonPosition }
							onChange={ ( position ) => {
								setAttributes( {
									buttonPosition: position,
								} );
							} }
						/>

						{ 'no-button' !== buttonPosition && (
							<ToolbarButton
								title={ __( 'Use button with icon' ) }
								icon={ buttonWithIcon }
								onClick={ () => {
									setAttributes( {
										buttonUseIcon: ! buttonUseIcon,
									} );
								} }
								isActive={ buttonUseIcon }
							/>
						) }
					</ToolbarGroup>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Search Settings' ) }>
						<UnitControl
							label={ __( 'Width' ) }
							min={ widthUnit === '%' ? 1 : MIN_WIDTH }
							max={
								isPercentageUnit( widthUnit ) ? 100 : undefined
							}
							decimalNum={ 1 }
							units={ CSS_UNITS }
							unit={ widthUnit }
							onChange={ this.onChange }
							onComplete={ this.onChangeWidth }
							onUnitChange={ this.onChangeUnit }
							value={ parseFloat( width ) }
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	}

	mergeWithBorderStyle( style ) {
		return { ...style, ...styles.border };
	}

	renderTextField() {
		const { attributes, setAttributes } = this.props;
		const { buttonPosition, placeholder } = attributes;

		const inputStyle =
			buttonPosition === 'button-inside'
				? styles.searchTextInput
				: this.mergeWithBorderStyle( styles.searchTextInput );

		return (
			<PlainText
				className="wp-block-search__input"
				isSelected={ this.state.isPlaceholderSelected }
				style={ inputStyle }
				numberOfLines={ 1 }
				ellipsizeMode="tail" // currently only works on ios
				label={ null }
				value={ placeholder }
				placeholder={
					placeholder ? undefined : __( 'Optional placeholder…' )
				}
				onChange={ ( newVal ) =>
					setAttributes( { placeholder: newVal } )
				}
				onFocus={ () => {
					this.props.onFocus();
					this.setState( { isPlaceholderSelected: true } );
				} }
				onBlur={ () => {
					this.setState( { isPlaceholderSelected: false } );
				} }
			/>
		);
	}

	renderButton() {
		const { attributes, setAttributes } = this.props;
		const { buttonText, buttonUseIcon } = attributes;

		return (
			<View style={ styles.buttonContainer }>
				{ buttonUseIcon && (
					<Button
						className="wp-block-search__button"
						icon={ search }
						onFocus={ this.props.onFocus }
					/>
				) }

				{ ! buttonUseIcon && (
					<RichText
						className="wp-block-search__button"
						identifier="text"
						tagName="p"
						style={ richTextStyles.searchButton }
						placeholder={ __( 'Add button text' ) }
						value={ buttonText }
						withoutInteractiveFormatting
						onChange={ ( html ) =>
							setAttributes( { buttonText: html } )
						}
						minWidth={ MIN_BUTTON_WIDTH }
						textAlign="center"
						isSelected={ this.state.isButtonSelected }
						__unstableMobileNoFocusOnMount={
							! this.props.isSelected
						}
						unstableOnFocus={ () => {
							this.setState( { isButtonSelected: true } );
						} }
						onBlur={ () => {
							this.setState( { isButtonSelected: false } );
						} }
					/>
				) }
			</View>
		);
	}

	getSearchBarStyle() {
		const { buttonPosition } = this.props.attributes;

		return buttonPosition === 'button-inside'
			? this.mergeWithBorderStyle( styles.searchBarContainer )
			: styles.searchBarContainer;
	}

	render() {
		const { attributes, setAttributes } = this.props;
		const { showLabel, label, buttonPosition } = attributes;

		return (
			<View style={ styles.searchBlockContainer }>
				{ this.props.isSelected && this.controls }

				{ showLabel && (
					<RichText
						className="wp-block-search__label"
						identifier="text"
						tagName="p"
						style={ {
							...styles.searchLabel,
							...richTextStyles.searchLabel,
						} }
						aria-label={ __( 'Label text' ) }
						placeholder={ __( 'Add label…' ) }
						withoutInteractiveFormatting
						value={ label }
						onChange={ ( html ) =>
							setAttributes( { label: html } )
						}
						isSelected={ this.state.isLabelSelected }
						__unstableMobileNoFocusOnMount={
							! this.props.isSelected
						}
						unstableOnFocus={ () => {
							this.setState( { isLabelSelected: true } );
						} }
						onBlur={ () => {
							this.setState( { isLabelSelected: false } );
						} }
					/>
				) }

				{ ( 'button-inside' === buttonPosition ||
					'button-outside' === buttonPosition ) && (
					<View style={ this.getSearchBarStyle() }>
						{ this.renderTextField() }
						{ this.renderButton() }
					</View>
				) }

				{ 'button-only' === buttonPosition && this.renderButton() }
				{ 'no-button' === buttonPosition && this.renderTextField() }
			</View>
		);
	}
}
