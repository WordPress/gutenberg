/**
 * External dependencies
 */
import {
	TouchableOpacity,
	Text,
	View,
	TextInput,
	I18nManager,
	AccessibilityInfo,
} from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import platformStyles from './cellStyles.scss';

class BottomSheetCell extends Component {
	constructor( props ) {
		super( ...arguments );
		this.state = {
			isEditingValue: props.autoFocus || false,
			isScreenReaderEnabled: false,
		};

		this.handleScreenReaderToggled = this.handleScreenReaderToggled.bind(
			this
		);
	}

	componentDidUpdate() {
		if ( this.state.isEditingValue ) {
			this._valueTextInput.focus();
		}
	}

	componentDidMount() {
		AccessibilityInfo.addEventListener(
			'screenReaderChanged',
			this.handleScreenReaderToggled
		);

		AccessibilityInfo.isScreenReaderEnabled().then(
			( isScreenReaderEnabled ) => {
				this.setState( { isScreenReaderEnabled } );
			}
		);
	}

	componentWillUnmount() {
		AccessibilityInfo.removeEventListener(
			'screenReaderChanged',
			this.handleScreenReaderToggled
		);
	}

	handleScreenReaderToggled( isScreenReaderEnabled ) {
		this.setState( { isScreenReaderEnabled } );
	}

	typeToKeyboardType( type, step ) {
		let keyboardType = `default`;
		if ( type === `number` ) {
			if ( step && Math.abs( step ) < 1 ) {
				keyboardType = `decimal-pad`;
			} else {
				keyboardType = `number-pad`;
			}
		}
		return keyboardType;
	}

	render() {
		const {
			accessible,
			accessibilityLabel,
			accessibilityHint,
			accessibilityRole,
			disabled = false,
			onPress,
			label,
			value,
			valuePlaceholder = '',
			icon,
			leftAlign,
			labelStyle = {},
			valueStyle = {},
			cellContainerStyle = {},
			cellRowContainerStyle = {},
			onChangeValue,
			children,
			editable = true,
			separatorType,
			style = {},
			getStylesFromColorScheme,
			customActionButton,
			type,
			step,
			...valueProps
		} = this.props;

		const showValue = value !== undefined;
		const isValueEditable = editable && onChangeValue !== undefined;
		const cellLabelStyle = getStylesFromColorScheme(
			styles.cellLabel,
			styles.cellTextDark
		);
		const cellLabelCenteredStyle = getStylesFromColorScheme(
			styles.cellLabelCentered,
			styles.cellTextDark
		);
		const cellLabelLeftAlignNoIconStyle = getStylesFromColorScheme(
			styles.cellLabelLeftAlignNoIcon,
			styles.cellTextDark
		);
		const defaultMissingIconAndValue = leftAlign
			? cellLabelLeftAlignNoIconStyle
			: cellLabelCenteredStyle;
		const defaultLabelStyle =
			showValue || icon !== undefined || customActionButton
				? cellLabelStyle
				: defaultMissingIconAndValue;

		const drawSeparator =
			( separatorType && separatorType !== 'none' ) ||
			separatorStyle === undefined;
		const drawTopSeparator =
			drawSeparator && separatorType === 'topFullWidth';

		const cellContainerStyles = [
			styles.cellContainer,
			cellContainerStyle,
		];
		const rowContainerStyles = [
			styles.cellRowContainer,
			cellRowContainerStyle,
		];

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
			//eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const defaultSeparatorStyle = this.props.getStylesFromColorScheme(
				styles.separator,
				styles.separatorDark
			);
			const cellSeparatorStyle = this.props.getStylesFromColorScheme(
				styles.cellSeparator,
				styles.cellSeparatorDark
			);
			const leftMarginStyle = {
				...cellSeparatorStyle,
				...platformStyles.separatorMarginLeft,
			};
			switch ( separatorType ) {
				case 'leftMargin':
					return leftMarginStyle;
				case 'fullWidth':
				case 'topFullWidth':
					return defaultSeparatorStyle;
				case 'none':
					return undefined;
				case undefined:
					return showValue ? leftMarginStyle : defaultSeparatorStyle;
			}
		};

		const getValueComponent = () => {
			const styleRTL = I18nManager.isRTL && styles.cellValueRTL;
			const cellValueStyle = this.props.getStylesFromColorScheme(
				styles.cellValue,
				styles.cellTextDark
			);
			const finalStyle = {
				...cellValueStyle,
				...valueStyle,
				...styleRTL,
			};

			// To be able to show the `middle` ellipsizeMode on editable cells
			// we show the TextInput just when the user wants to edit the value,
			// and the Text component to display it.
			// We also show the TextInput to display placeholder.
			const shouldShowPlaceholder = isValueEditable && value === '';
			return this.state.isEditingValue || shouldShowPlaceholder ? (
				<TextInput
					ref={ ( c ) => ( this._valueTextInput = c ) }
					numberOfLines={ 1 }
					style={ finalStyle }
					value={ value }
					placeholder={ valuePlaceholder }
					placeholderTextColor={ '#87a6bc' }
					onChangeText={ onChangeValue }
					editable={ isValueEditable }
					pointerEvents={
						this.state.isEditingValue ? 'auto' : 'none'
					}
					onFocus={ startEditing }
					onBlur={ finishEditing }
					keyboardType={ this.typeToKeyboardType( type, step ) }
					{ ...valueProps }
				/>
			) : (
				<Text
					style={ { ...cellValueStyle, ...valueStyle } }
					numberOfLines={ 1 }
					ellipsizeMode={ 'middle' }
				>
					{ value }
				</Text>
			);
		};

		const getAccessibilityLabel = () => {
			if ( accessibilityLabel || ! showValue ) {
				return accessibilityLabel || label;
			}
			return isEmpty( value )
				? sprintf(
						/* translators: accessibility text. Empty state of a inline textinput cell. %s: The cell's title */
						_x( '%s. Empty', 'inline textinput cell' ),
						label
				  )
				: // Separating by ',' is necessary to make a pause on urls (non-capitalized text)
				  sprintf(
						/* translators: accessibility text. Inline textinput title and value.%1: Cell title, %2: cell value. */
						_x( '%1$s, %2$s', 'inline textinput cell' ),
						label,
						value
				  );
		};

		const iconStyle = getStylesFromColorScheme(
			styles.icon,
			styles.iconDark
		);
		const resetButtonStyle = getStylesFromColorScheme(
			styles.resetButton,
			styles.resetButtonDark
		);
		const containerPointerEvents =
			this.state.isScreenReaderEnabled && accessible ? 'none' : 'auto';
		const { title, handler } = customActionButton || {};

		return (
			<TouchableOpacity
				accessible={
					accessible !== undefined
						? accessible
						: ! this.state.isEditingValue
				}
				accessibilityLabel={ getAccessibilityLabel() }
				accessibilityRole={ accessibilityRole || 'button' }
				accessibilityHint={
					isValueEditable
						? /* translators: accessibility text */
						  __( 'Double tap to edit this value' )
						: accessibilityHint
				}
				disabled={ disabled }
				onPress={ onCellPress }
				style={ [ styles.clipToBounds, style ] }
			>
				{ drawTopSeparator && <View style={ separatorStyle() } /> }
				<View
					style={ cellContainerStyles }
					pointerEvents={ containerPointerEvents }
				>
					<View style={ rowContainerStyles }>
						<View style={ styles.cellRowContainer }>
							{ icon && (
								<View style={ styles.cellRowContainer }>
									<Icon
										icon={ icon }
										size={ 24 }
										color={ iconStyle.color }
									/>
									<View
										style={
											platformStyles.labelIconSeparator
										}
									/>
								</View>
							) }
							<Text style={ [ defaultLabelStyle, labelStyle ] }>
								{ label }
							</Text>
						</View>
						{ customActionButton && (
							<TouchableOpacity
								onPress={ handler }
								accessibilityRole={ 'button' }
							>
								<Text style={ resetButtonStyle }>
									{ title }
								</Text>
							</TouchableOpacity>
						) }
					</View>
					{ showValue && getValueComponent() }
					{ children }
				</View>
				{ ! drawTopSeparator && <View style={ separatorStyle() } /> }
			</TouchableOpacity>
		);
	}
}

export default withPreferredColorScheme( BottomSheetCell );
