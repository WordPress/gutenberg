import PropTypes from 'prop-types';
import React from 'react';
import ReactNative, {requireNativeComponent, ViewPropTypes, UIManager, ColorPropType, TouchableWithoutFeedback} from 'react-native';
import TextInputState from 'react-native/lib/TextInputState';

const AztecManager = UIManager.RCTAztecView;

class AztecView extends React.Component {
  
  static propTypes = {
    isSelected: PropTypes.bool,
    disableGutenbergMode: PropTypes.bool,
    text: PropTypes.object,
    placeholder: PropTypes.string,
    placeholderTextColor: ColorPropType,
    color: ColorPropType,
    maxImagesWidth: PropTypes.number,
    minImagesWidth: PropTypes.number,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onContentSizeChange: PropTypes.func,
    onEnter: PropTypes.func,
    onBackspace: PropTypes.func,
    onScroll: PropTypes.func,
    onActiveFormatsChange: PropTypes.func,
    onActiveFormatAttributesChange: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onHTMLContentWithCursor: PropTypes.func,
    ...ViewPropTypes, // include the default view properties
  }

  dispatch(command, params) {
    params = params || [];
    UIManager.dispatchViewManagerCommand(
                                          ReactNative.findNodeHandle(this),
                                          command,
                                          params,
    );
  }

  applyFormat(format) {
    this.dispatch(AztecManager.Commands.applyFormat, [format])
  }

  removeLink() {
    this.dispatch(AztecManager.Commands.removeLink)
  }

  setLink(url, title) {
    this.dispatch(AztecManager.Commands.setLink, [url, title])
  }

  requestHTMLWithCursor() {
    this.dispatch(AztecManager.Commands.returnHTMLWithCursor)
  }

  _onActiveFormatsChange = (event) => {
    if (!this.props.onActiveFormatsChange) {
      return;
    }
    const formats = event.nativeEvent.formats;
    const { onActiveFormatsChange } = this.props;
    onActiveFormatsChange(formats);
  }

  _onActiveFormatAttributesChange = (event) => {
    if (!this.props.onActiveFormatAttributesChange) {
      return;
    }
    const attributes = event.nativeEvent.attributes;
    const { onActiveFormatAttributesChange } = this.props;
    onActiveFormatAttributesChange(attributes);
  }

  _onContentSizeChange = (event) => {
    if (!this.props.onContentSizeChange) {
      return;
    }
    const size = event.nativeEvent.contentSize;
    const { onContentSizeChange } = this.props;
    onContentSizeChange(size);
  }

  _onEnter = (event) => {
    if (!this.props.onEnter) {
      return;
    }

    const { onEnter } = this.props;
    onEnter(event);
  }

  _onBackspace = (event) => {
    if (!this.props.onBackspace) {
      return;
    }

    const { onBackspace } = this.props;
    onBackspace(event);
  }

  _onHTMLContentWithCursor = (event) => {
    if (!this.props.onHTMLContentWithCursor) {
      return;
    }
    
    const text = event.nativeEvent.text;
    const selectionStart = event.nativeEvent.selectionStart;
    const selectionEnd = event.nativeEvent.selectionEnd;
    const { onHTMLContentWithCursor } = this.props;
    onHTMLContentWithCursor(text, selectionStart, selectionEnd);
  }

  _onFocus = (event) => {
    if (!this.props.onFocus) {
      return;
    }

    const { onFocus } = this.props;
    onFocus(event);
  }
  
  _onBlur = (event) => {
    TextInputState.blurTextInput(ReactNative.findNodeHandle(this));

    if (!this.props.onBlur) {
      return;
    }

    const { onBlur } = this.props;
    onBlur(event);
  }

  _onSelectionChange = (event) => {
    if (!this.props.onSelectionChange) {
      return;
    }
    const { selectionStart, selectionEnd, text } = event.nativeEvent;
    const { onSelectionChange } = this.props;
    onSelectionChange(selectionStart, selectionEnd, text);
  }

  focus = () => {
    TextInputState.focusTextInput(ReactNative.findNodeHandle(this));
  }

  _onPress = () => {
    this.focus();
  }

  render() {
    const { onActiveFormatsChange, ...otherProps } = this.props    
    return (
      <TouchableWithoutFeedback onPress={ this._onPress }>
        <RCTAztecView {...otherProps}
          onActiveFormatsChange={ this._onActiveFormatsChange }
          onActiveFormatAttributesChange={ this._onActiveFormatAttributesChange }
          onContentSizeChange = { this._onContentSizeChange }
          onHTMLContentWithCursor = { this._onHTMLContentWithCursor }
          onSelectionChange = { this._onSelectionChange }
          onEnter = { this._onEnter }
          onFocus = { this._onFocus }
          onBlur = { this._onBlur }
          onBackspace = { this._onBackspace }
        />
      </TouchableWithoutFeedback>
    );
  }
}

const RCTAztecView = requireNativeComponent('RCTAztecView', AztecView);

export default AztecView