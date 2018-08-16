import PropTypes from 'prop-types';
import React from 'react';
import ReactNative, {requireNativeComponent, ViewPropTypes, UIManager, ColorPropType} from 'react-native';

class AztecView extends React.Component {
  
  static propTypes = {
    text: PropTypes.object,
    placeholder: PropTypes.string,
    placeholderTextColor: ColorPropType,
    color: PropTypes.string,
    maxImagesWidth: PropTypes.number,
    minImagesWidth: PropTypes.number,
    onChange: PropTypes.func,
    onContentSizeChange: PropTypes.func,
    onScroll: PropTypes.func,
    ...ViewPropTypes, // include the default view properties
  }

  applyFormat(format) {   
    UIManager.dispatchViewManagerCommand(
                                          ReactNative.findNodeHandle(this),
                                          UIManager.RCTAztecView.Commands.applyFormat,
                                          [format],
                                        );    
  }

  render() {
    return (<RCTAztecView {...this.props} />);
  }
}

const RCTAztecView = requireNativeComponent('RCTAztecView', AztecView);

export default AztecView