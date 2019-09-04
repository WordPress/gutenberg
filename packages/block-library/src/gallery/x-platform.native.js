import { Text } from 'react-native';

export { withNotices } from '@wordpress/components';
export { BlockIcon } from '@wordpress/block-editor';

const MediaPlaceholder = props => <Text>FakeMediaPlaceholder</Text>;
const InspectorControls = props => <Text>FakeInspectorControls</Text>
const RangeControl = props => <Text>FakeRangeControl</Text>
const ToggleControl = props => <Text>FakeToggleControl</Text>
const SelectControl = props => <Text>FakeSelectControl</Text>
const PanelBody = props => <Text>FakePanelBody</Text>

export {
  MediaPlaceholder,
  InspectorControls,
  RangeControl,
  ToggleControl,
  SelectControl,
  PanelBody
};