/**
 * External dependencies
 */
import { TouchableOpacity, Text, View, TextInput, I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Dashicon from '../../dashicon';
import styles from './styles.scss';
import platformStyles from './cellStyles.scss';

export default class Cell extends Component {
	constructor( props ) {
		super( ...arguments );
		this.state = {
			isEditingValue: props.autoFocus || false,
		};
	}

	componentDidUpdate() {
		if ( this.state.isEditingValue ) {
			this._valueTextInput.focus();
		}
	}

	render() {
		const {
			onPress,
			label,
			value,
			valuePlaceholder = '',
			icon,
			labelStyle = {},
			valueStyle = {},
			onChangeValue,
			children,
			editable = true,
			separatorType,
			style = {},
			...valueProps
		} = this.props;

		const showValue = value !== undefined;
		const isValueEditable = editable && onChangeValue !== undefined;
		const defaultLabelStyle = showValue || icon !== undefined ? styles.cellLabel : styles.cellLabelCentered;
		const drawSeparator = ( separatorType && separatorType !== 'none' ) || separatorStyle === undefined;

		const onCellPress = () => {
			if ( isValueEditable ) {
				startEditing();
			} else if ( onPress !== undefined ) {
				onPress();
			}
		};

		const finishEditing = () => {
			this.setState( { isEditingValue: false } );
		};

		const startEditing = () => {
			if ( this.state.isEditingValue === false ) {
				this.setState( { isEditingValue: true } );
			}
		};

		const separatorStyle = () => {
			const leftMarginStyle = { ...styles.cellSeparator, ...platformStyles.separatorMarginLeft };
			switch ( separatorType ) {
				case 'leftMargin':
					return leftMarginStyle;
				case 'fullWidth':
					return styles.separator;
				case 'none':
					return undefined;
				case undefined:
					return showValue ? leftMarginStyle : styles.separator;
			}
		};

		const getValueComponent = () => {
			const styleRTL = I18nManager.isRTL && styles.cellValueRTL;
			const finalStyle = { ...styles.cellValue, ...valueStyle, ...styleRTL };

			// To be able to show the `middle` ellipsizeMode on editable cells
			// we show the TextInput just when the user wants to edit the value,
			// and the Text component to display it.
			// We also show the TextInput to display placeholder.
			const shouldShowPlaceholder = isValueEditable && value === '';
			return this.state.isEditingValue || shouldShowPlaceholder ? (
				<TextInput
					ref={ ( c ) => this._valueTextInput = c }
					numberOfLines={ 1 }
					style={ finalStyle }
					value={ value }
					placeholder={ valuePlaceholder }
					placeholderTextColor={ '#87a6bc' }
					onChangeText={ onChangeValue }
					editable={ isValueEditable }
					pointerEvents={ this.state.isEditingValue ? 'auto' : 'none' }
					onFocus={ startEditing }
					onBlur={ finishEditing }
					{ ...valueProps }
				/>
			) : (
				<Text
					style={ { ...styles.cellValue, ...valueStyle } }
					numberOfLines={ 1 }
					ellipsizeMode={ 'middle' }
				>
					{ value }
				</Text>
			);
		};

		return (
			<TouchableOpacity onPress={ onCellPress } style={ { ...styles.clipToBounds, ...style } } >
				<View style={ styles.cellContainer }>
					<View style={ styles.cellRowContainer }>
						{ icon && (
							<View style={ styles.cellRowContainer }>
								<Dashicon icon={ icon } size={ 24 } />
								<View style={ platformStyles.labelIconSeparator } />
							</View>
						) }
						<Text numberOfLines={ 1 } style={ { ...defaultLabelStyle, ...labelStyle } }>
							{ label }
						</Text>
					</View>
					{ showValue && getValueComponent() }
					{ children }
				</View>
				{ drawSeparator && (
					<View style={ separatorStyle() } />
				) }
			</TouchableOpacity>
		);
	}
}
