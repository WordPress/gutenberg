/** @format */

import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '../../../i18n';

export function edit( { attributes, setAttributes, isSelected } ) {
  const { customText, noTeaser } = attributes;
  const defaultText = __( 'Read more' );
  const value = customText !== undefined ? customText : defaultText;

  return (
    <View style={{ alignItems: 'center', padding: 4}}>
      <Text>&lt;!-- More: { value } --&gt;</Text>
    </View>
  );
}
