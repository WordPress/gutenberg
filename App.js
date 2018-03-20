/** @format */

// @flow

import React from 'react';
import { settings as codeBlock } from './gutenberg/blocks/library/code'
import BlockManager from './block-management/block-manager';

export default class App extends React.Component<{}> {
	render() {
		Code = codeBlock.edit;
        <Code
          attributes={{content: 'Code block text'}}
          setAttributes={ ( attrs ) => console.log( { attrs } ) }
        />
		return <BlockManager />;
	}
}
