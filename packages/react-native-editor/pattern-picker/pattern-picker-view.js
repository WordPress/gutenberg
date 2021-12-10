import React, { useEffect, useRef } from 'react';
import { UIManager, findNodeHandle, PixelRatio, Dimensions } from 'react-native';

import { PatternPickerViewManager } from './index';

const createFragment = (viewId) =>
  UIManager.dispatchViewManagerCommand(
    viewId,
    UIManager.PatternPickerViewManager.Commands.create.toString(), // we are calling the 'create' command
    [viewId]
  );

export const PatternPicker = ({ style }) => {
  const ref = useRef(null);
  const onPatternPicked = useRef(null);

  useEffect(() => {
    const viewId = findNodeHandle(ref.current);
    // createFragment(viewId!);
    onPatternPicked.current = (event) => console.log(event);
    createFragment(viewId);
  }, []);

  const width = style?.width || Dimensions.get('window').width;
  const height = style?.height || Dimensions.get('window').height - 70;

  return (
    <PatternPickerViewManager
      style={ {
        // ...(style || {}),
        // height: style && style.height !== undefined ? style.height : '100%',
        // width: style && style.width !== undefined ? style.width : '100%'
        // width: PixelRatio.getPixelSizeForLayoutSize(300),
        // height: PixelRatio.getPixelSizeForLayoutSize(600)
        width: PixelRatio.getPixelSizeForLayoutSize(width),
        height: PixelRatio.getPixelSizeForLayoutSize(height)
      } }
      ref={ref}
      onPatternPicked={ onPatternPicked.current }
    />
  );
};
