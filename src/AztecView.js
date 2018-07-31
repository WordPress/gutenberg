import PropTypes from 'prop-types';
import {requireNativeComponent, ViewPropTypes} from 'react-native';

var aztex = {
  name: 'AztecView',
  propTypes: {
    text: PropTypes.object,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.number,
    color: PropTypes.string,
    maxImagesWidth: PropTypes.number,
    minImagesWidth: PropTypes.number,
    onChange: PropTypes.func,
    onContentSizeChange: PropTypes.func,
    onScroll: PropTypes.func,
    ...ViewPropTypes, // include the default view properties
  },
};

module.exports = requireNativeComponent('RCTAztecView', aztex);