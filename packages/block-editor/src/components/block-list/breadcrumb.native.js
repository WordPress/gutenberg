/**
 * WordPress dependencies
 */
import { Toolbar, Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string}   props.clientId        Client ID of block.
 * @return {WPElement} Block Breadcrumb.
 */
const BlockBreadcrumb = ( { clientId, rootClientId, setNavigationMode } ) => {
	return (
		<View>
			<Toolbar>
				{ rootClientId && (
					<BlockTitle clientId={ rootClientId } />
				) }
				<Button onClick={ () => setNavigationMode( false ) }>
					<BlockTitle clientId={ clientId } />
				</Button>
			</Toolbar>
		</View>
	);
};

export default compose( [
	withSelect( ( select, { clientId, rootClientId } ) => {
		return {
			clientId,
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			setNavigationMode,
		} = dispatch( 'core/block-editor' );

		return {
			setNavigationMode( isNavigationMode ) {
				setNavigationMode( isNavigationMode );
			},
		};
	} ),
] )( BlockBreadcrumb );
