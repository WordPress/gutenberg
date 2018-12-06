/** @flow
 * @format */

import React from 'react';
import {
	subscribeParentGetHtml,
	subscribeParentToggleHTMLMode,
	subscribeUpdateHtml,
} from 'react-native-gutenberg-bridge';

import BlockManager from '../block-management/block-manager';
import { SlotFillProvider } from '@wordpress/components';

import type { EmitterSubscription } from 'react-native';

import type { BlockType } from '../store/types';

type PropsType = {
	rootClientId: ?string,
	onChange: ( clientId: string, attributes: mixed ) => void,
	focusBlockAction: string => void,
	moveBlockUpAction: string => mixed,
	moveBlockDownAction: string => mixed,
	deleteBlockAction: string => mixed,
	createBlockAction: ( string, BlockType ) => mixed,
	serializeToNativeAction: void => void,
	toggleHtmlModeAction: void => void,
	updateHtmlAction: string => void,
	mergeBlocksAction: ( string, string ) => mixed,
	blocks: Array<BlockType>,
	isBlockSelected: string => boolean,
	showHtml: boolean,
};

type StateType = {};

export default class MainScreen extends React.Component<PropsType, StateType> {
	subscriptionParentGetHtml: ?EmitterSubscription;
	subscriptionParentToggleHTMLMode: ?EmitterSubscription;
	subscriptionParentUpdateHtml: ?EmitterSubscription;

	componentDidMount() {
		this.subscriptionParentGetHtml = subscribeParentGetHtml( () => {
			this.props.serializeToNativeAction();
		} );

		this.subscriptionParentToggleHTMLMode = subscribeParentToggleHTMLMode( () => {
			this.props.toggleHtmlModeAction();
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
