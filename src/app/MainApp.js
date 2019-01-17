/** @flow
 * @format */

import React from 'react';
import {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeSetTitle,
	subscribeUpdateHtml,
} from 'react-native-gutenberg-bridge';

import BlockManager from '../block-management/block-manager';
import { SlotFillProvider } from '@wordpress/components';

import type { EmitterSubscription } from 'react-native';

type PropsType = {
	rootClientId: ?string,
	serializeToNativeAction: void => void,
	toggleHtmlModeAction: void => void,
	setTitleAction: string => void,
	updateHtmlAction: string => void,
	title: string,
};

type StateType = {};

export default class MainScreen extends React.Component<PropsType, StateType> {
	subscriptionParentGetHtml: ?EmitterSubscription;
	subscriptionParentToggleHTMLMode: ?EmitterSubscription;
	subscriptionParentSetTitle: ?EmitterSubscription;
	subscriptionParentUpdateHtml: ?EmitterSubscription;

	componentDidMount() {
		this.subscriptionParentGetHtml = subscribeParentGetHtml( () => {
			this.props.serializeToNativeAction();
		} );

		this.subscriptionParentToggleHTMLMode = subscribeParentToggleHTMLMode( () => {
			this.props.toggleHtmlModeAction();
		} );

		this.subscriptionParentSetTitle = subscribeSetTitle( ( payload ) => {
			this.props.setTitleAction( payload.title );
		} );

		this.subscriptionParentUpdateHtml = subscribeUpdateHtml( ( payload ) => {
			this.props.updateHtmlAction( payload.html );
		} );
	}

	componentWillUnmount() {
		if ( this.subscriptionParentGetHtml ) {
			this.subscriptionParentGetHtml.remove();
		}
		if ( this.subscriptionParentToggleHTMLMode ) {
			this.subscriptionParentToggleHTMLMode.remove();
		}
		if ( this.subscriptionParentSetTitle ) {
			this.subscriptionParentSetTitle.remove();
		}
		if ( this.subscriptionParentUpdateHtml ) {
			this.subscriptionParentUpdateHtml.remove();
		}
	}

	render() {
		return (
			<SlotFillProvider>
				<BlockManager { ...this.props } />
			</SlotFillProvider>
		);
	}
}
