/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { PanelBody, TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';
import styles from './styles.scss';

function Separator() {
	const separatorStyle = usePreferredColorSchemeStyle(
		styles[ 'components-picker__separator' ],
		styles[ 'components-picker__separator--dark' ]
	);

	return <View style={ separatorStyle } />;
}

export default class Picker extends Component {
	constructor() {
		super( ...arguments );
		this.onClose = this.onClose.bind( this );
		this.onCellPress = this.onCellPress.bind( this );

		this.state = {
			isVisible: false,
		};
	}

	presentPicker() {
		this.setState( { isVisible: true } );
	}

	onClose() {
		this.setState( { isVisible: false } );
	}

	onCellPress( value ) {
		const { onChange } = this.props;
		onChange( value );
		this.onClose();
	}

	getOptions() {
		const { options, leftAlign } = this.props;

		return options.map( ( option ) => (
			<Fragment key={ `${ option.label }-${ option.value }` }>
				{ options.length > 1 && option.separated && <Separator /> }
				<BottomSheet.Cell
					icon={ option.icon }
					leftAlign={ leftAlign }
					label={ option.label }
					separatorType={ 'none' }
					onPress={ () => this.onCellPress( option.value ) }
					disabled={ option.disabled }
					style={
						option.disabled &&
						styles[ 'components-picker__button--disabled' ]
					}
				/>
			</Fragment>
		) );
	}

	render() {
		const { hideCancelButton, title, testID } = this.props;
		const { isVisible } = this.state;

		return (
			<BottomSheet
				isVisible={ isVisible }
				onClose={ this.onClose }
				hideHeader
				testID={ testID }
			>
				<PanelBody
					title={ title }
					style={ styles[ 'components-picker__panel' ] }
				>
					{ this.getOptions() }
					{ ! hideCancelButton && (
						<TextControl
							label={ __( 'Cancel' ) }
							onPress={ this.onClose }
							separatorType={ 'none' }
						/>
					) }
				</PanelBody>
			</BottomSheet>
		);
	}
}
