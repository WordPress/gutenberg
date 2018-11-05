/** @flow
 * @format */

import React from 'react';
import {
	subscribeParentGetHtml,
	subscribeParentSetImageSource,
} from 'react-native-gutenberg-bridge';

import BlockManager, { type BlockListType } from '../block-management/block-manager';

import type { EmitterSubscription } from 'react-native';

type PropsType = BlockListType;
type StateType = {};

export default class MainScreen extends React.Component<PropsType, StateType> {
	subscriptionParentGetHtml: ?EmitterSubscription;
	subscriptionSetImageSource: ?EmitterSubscription;

	componentDidMount() {
		this.subscriptionParentGetHtml = subscribeParentGetHtml( () => {
			this.props.serializeToNativeAction();
		} );
		this.subscriptionSetImageSource = subscribeParentSetImageSource( ( data ) => {
			this.props.setImageSourceAction( data.url );
		} );
	}

	componentWillUnmount() {
		if ( this.subscriptionParentGetHtml ) {
			this.subscriptionParentGetHtml.remove();
		}
		if ( this.subscriptionSetImageSource ) {
			this.subscriptionSetImageSource.remove();
		}
	}

	render() {
		return <BlockManager { ...this.props } />;
	}
}
