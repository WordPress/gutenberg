import PropTypes from 'prop-types';
import React from 'react';
import ReactNative, {requireNativeComponent, ViewPropTypes, UIManager, ColorPropType} from 'react-native';

class AztecView extends React.Component {
  
  static propTypes = {
    disableGutenbergMode: PropTypes.bool,
    text: PropTypes.object,
    placeholder: PropTypes.string,
    placeholderTextColor: ColorPropType,
    color: ColorPropType,
    maxImagesWidth: PropTypes.number,
    minImagesWidth: PropTypes.number,
    onChange: PropTypes.func,
    onContentSizeChange: PropTypes.func,
    onEnter: PropTypes.func,
    onScroll: PropTypes.func,
    onActiveFormatsChange: PropTypes.func,
    onHTMLContentWithCursor: PropTypes.func,
    ...ViewPropTypes, // include the default view properties
  }

  applyFormat(format) {   
    UIManager.dispatchViewManagerCommand(
                                          ReactNative.findNodeHandle(this),
                                          UIManager.RCTAztecView.Commands.applyFormat,
                                          [format],
                                        );    
  }

  requestHTMLWithCursor() {
    UIManager.dispatchViewManagerCommand(
                                          ReactNative.findNodeHandle(this),
                                          UIManager.RCTAztecView.Commands.returnHTMLWithCursor,
                                          [],
                                        );    
  }

  _onActiveFormatsChange = (event) => {
    if (!this.props.onActiveFormatsChange) {
      return;
    }
    const formats = event.nativeEvent.formats;
    const { onActiveFormatsChange } = this.props;
    onActiveFormatsChange(formats);
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

  render() {
    const { onActiveFormatsChange, ...otherProps } = this.props    
    return (
      <RCTAztecView {...otherProps} 
        onActiveFormatsChange={ this._onActiveFormatsChange }
        onContentSizeChange = { this._onContentSizeChange }
        onHTMLContentWithCursor = { this._onHTMLContentWithCursor }
        onEnter = { this._onEnter }
      />
    );
  }
}

const RCTAztecView = requireNativeComponent('RCTAztecView', AztecView);

export default AztecView