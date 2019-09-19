/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

import styles from './breadcrumb.scss';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string}   props.clientId        Client ID of block.
 * @return {WPElement} Block Breadcrumb.
 */
const BlockBreadcrumb = ( { clientId, blockIcon, rootClientId, rootBlockIcon } ) => {
	return (
		<View style={ styles.breadcrumbContainer }>
			<TouchableOpacity style={ styles.button } onPress={ () => {/* Open BottomSheet with markup */} }>
				{ rootClientId && rootBlockIcon && (
					<Icon size={ 20 } icon={ rootBlockIcon.src } fill={ styles.breadcrumbTitle.color } />
				) }
				<Icon size={ 24 } icon={ blockIcon.src } fill={ styles.breadcrumbTitle.color } />
				<Text style={ styles.breadcrumbTitle }><BlockTitle clientId={ clientId } /></Text>
			</TouchableOpacity>
		</View>
	);
};

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockRootClientId,
			getBlockName,
		} = select( 'core/block-editor' );

		const blockName = getBlockName( clientId );
		const blockType = getBlockType( blockName );
		const blockIcon = blockType.icon;

		const rootClientId = getBlockRootClientId( clientId );

		if ( ! rootClientId ) {
			return {
				clientId,
				blockIcon,
			};
		}
		const rootBlockName = getBlockName( rootClientId );
		const rootBlockType = getBlockType( rootBlockName );
		const rootBlockIcon = rootBlockType.icon;

		return {
			clientId,
			blockIcon,
			rootClientId,
			rootBlockIcon,
		};
	} ),
] )( BlockBreadcrumb );
