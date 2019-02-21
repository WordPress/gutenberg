/**
 * @format
 * @flow
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { BlockType } from '../../store/types';
import { coreBlocks } from '@wordpress/block-library';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import { normalizeIconObject } from '@wordpress/blocks';

type PropsType = BlockType & {
	onChange: ( clientId: string, attributes: mixed ) => void,
	onToolbarButtonPressed: ( button: number, clientId: string ) => void,
	onBlockHolderPressed: ( clientId: string ) => void,
};

// Styles
import styles from '../../block-management/block-holder.scss';

export default class UnsupportedBlockEdit extends React.Component<PropsType> {
	render() {
		const { originalName } = this.props.attributes;
		const blockType = coreBlocks[ originalName ];
		const title = blockType ? blockType.settings.title : __( 'Unsupported' );
		const icon = blockType ? normalizeIconObject( blockType.settings.icon ) : 'admin-plugins';

		return (
			<View style={ styles.unsupportedBlock }>
				<View style={ styles.unsupportedBlockImagePlaceholder }>
					<Icon icon={ icon && icon.src ? icon.src : icon } />
				</View>
				<Text style={ styles.unsupportedBlockMessage }>{ title }</Text>
			</View>
		);
	}
}
