import PropTypes from 'prop-types';
import React from 'react';
import ReactNative, {requireNativeComponent, ViewPropTypes, UIManager, ColorPropType} from 'react-native';

class AztecView extends React.Component {
  
  static propTypes = {
    text: PropTypes.object,
    placeholder: PropTypes.string,
    placeholderTextColor: ColorPropType,
    color: ColorPropType,
    maxImagesWidth: PropTypes.number,
    minImagesWidth: PropTypes.number,
    onChange: PropTypes.func,
    onContentSizeChange: PropTypes.func,
    onScroll: PropTypes.func,
    onActiveFormatsChange: PropTypes.func,
    ...ViewPropTypes, // include the default view properties
  }

  applyFormat(format) {   
    UIManager.dispatchViewManagerCommand(
                                          ReactNative.findNodeHandle(this),
                                          UIManager.RCTAztecView.Commands.applyFormat,
                                          [format],
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

  render() {
    const { onActiveFormatsChange, ...otherProps } = this.props    
    return (<RCTAztecView {...otherProps} onActiveFormatsChange={ this._onActiveFormatsChange } />);
  }
}

const RCTAztecView = requireNativeComponent('RCTAztecView', AztecView);

export default AztecView