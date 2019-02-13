/**
 * External dependencies
 */
import { TouchableOpacity, Text, View, TextInput } from 'react-native';

/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export default class Cell extends Component {
	_valueTextInput = undefined;

	constructor() {
		super( ...arguments );
		this.state = {
			isEditingValue: false,
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
			...valueProps
		} = this.props;

		const showValue = value !== undefined;
		const isValueEditable = editable && onChangeValue !== undefined;
		const defaultLabelStyle = showValue ? styles.cellLabel : styles.cellLabelCentered;
		const drawSeparator = ( separatorType && separatorType !== 'none' ) || separatorStyle === undefined;

		const onCellPress = () => {
			if ( isValueEditable ) {
				this.setState( { isEditingValue: true } );
			} else if ( onPress !== undefined ) {
				onPress();
			}
		};

		const finishEditing = () => {
			this.setState( { isEditingValue: false } );
		};

		const separatorStyle = () => {
			switch ( separatorType ) {
				case 'leftMargin':
					return styles.cellSeparator;
				case 'fullWidth':
					return styles.separator;
				case 'none':
					return undefined;
				case undefined:
					return showValue ? styles.cellSeparator : styles.separator;
			}
		};

		const getValueComponent = () => {
			// To be able to show the `middle` ellipsizeMode on editable cells
			// we show the TextInput just when the user wants to edit the value,
			// and the Text component to display it.
			// We also show the TextInput to display placeholder.
			const shouldShowPlaceholder = isValueEditable && value === '';
			return this.state.isEditingValue || shouldShowPlaceholder ? (
				<TextInput
					ref={ ( c ) => this._valueTextInput = c }
					numberOfLines={ 1 }
					style={ { ...styles.cellValue, ...valueStyle } }
					value={ value }
					placeholder={ valuePlaceholder }
					placeholderTextColor={ '#87a6bc' }
					onChangeText={ onChangeValue }
					editable={ isValueEditable }
					pointerEvents={ this.state.isEditingValue ? 'auto' : 'none' }
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
			<TouchableOpacity onPress={ onCellPress } style={ styles.clipToBounds } >
				<View style={ styles.cellContainer }>
					<View style={ styles.cellRowContainer }>
						{ icon && (
							<View style={ styles.cellRowContainer }>
								<Dashicon icon={ icon } size={ 24 } />
								<View style={ { width: 12 } } />
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
