// @flow

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { settings as codeBlock } from './gutenberg/blocks/library/code'

export default class App extends React.Component<{}> {
  render() {
    Code = codeBlock.edit;
    return (
      <View style={styles.container}>
        <Code
          attributes={{content: 'Code block text'}}
          setAttributes={ ( attrs ) => console.log( { attrs } ) }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
