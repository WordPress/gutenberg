/** @format */

import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '../../../i18n';

/**
 * Internal dependencies
 */
import PlainText from '../../plain-text';

export function edit( { attributes, setAttributes, isSelected } ) {
  const { customText, noTeaser } = attributes;
  const defaultText = __( 'Read more' );
  const value = customText !== undefined ? customText : defaultText;

  return (
    <View style={{ padding: 4, alignItems: 'center' }}>
      <View style={{ alignItems: 'center', flexDirection: "row"}}>
        <Text style={{ fontFamily: 'monospace' }}>&lt;!--</Text>
        <PlainText
          value={ value }
          multiline={ false }
          underlineColorAndroid="transparent"
          onChange={ content => setAttributes( { content } ) }
          placeholder={ defaultText }
        />
        <Text style={{ fontFamily: 'monospace' }}>--&gt;</Text>
      </View>
    </View>);
}
