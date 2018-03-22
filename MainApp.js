/** @format */

// @flow

import React from 'react';

import { registerCoreBlocks } from '@gutenberg/blocks/library';

import BlockManager from './block-management/block-manager';
import type { BlockArray } from './block-management/block-manager';

type PropsType = {
	blocks: BlockArray,
};
type StateType = {};

export default class MainScreen extends React.Component<PropsType, StateType> {
	constructor( props: Props ) {
		super( props );

		registerCoreBlocks();
	}

	render() {
		return <BlockManager { ...this.props } />;
	}
}
