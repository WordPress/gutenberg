/**
 * External dependencies
 */
import { TextInput } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default class PlainText extends React.Component {
	componentDidMount() {
		// if isSelected is true, we should request the focus on this TextInput
		if ( (this._input.isFocused() === false) && (this._input.props.isSelected === true) ) {
			this.focus();
		}
	}

	focus () {
	  this._input && this._input.focus()
	}

	render () {
	  return (
		<TextInput
			ref={(x) => this._input = x}
			className={ [ styles[ 'editor-plain-text' ], this.props.className ] }
			onChangeText={ ( text ) => this.props.onChange( text ) }
			{...this.props}
		/>
	  )
	}
}