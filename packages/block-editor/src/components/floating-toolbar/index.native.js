/**
 * External dependencies
 */
import { View, TouchableWithoutFeedback, I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton, Toolbar } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import NavigateUpSVG from './nav-up-icon';
import Breadcrumb from '../block-list/breadcrumb.native';

const FloatingToolbar = ( {
	selectedClientId,
	parentId,
	showFloatingToolbar,
	onNavigateUp,
} ) =>
	!! showFloatingToolbar && (
		<TouchableWithoutFeedback accessible={ false }>
			<View style={ styles.floatingToolbar }>
				{ !! parentId && (
					<Toolbar passedStyle={ styles.toolbar }>
						<ToolbarButton
							title={ __( 'Navigate Up' ) }
							onClick={ () => onNavigateUp( parentId ) }
							icon={
								<NavigateUpSVG isRTL={ I18nManager.isRTL } />
							}
						/>
						<View style={ styles.pipe } />
					</Toolbar>
				) }
				<Breadcrumb clientId={ selectedClientId } />
			</View>
		</TouchableWithoutFeedback>
	);

export default compose( [
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockHierarchyRootClientId,
			getBlockRootClientId,
			getBlockCount,
		} = select( 'core/block-editor' );

		const selectedClientId = getSelectedBlockClientId();

		if ( ! selectedClientId ) return;

		const rootBlockId = getBlockHierarchyRootClientId( selectedClientId );

		return {
			selectedClientId,
			showFloatingToolbar: !! getBlockCount( rootBlockId ),
			parentId: getBlockRootClientId( selectedClientId ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { selectBlock } = dispatch( 'core/block-editor' );

		return {
			onNavigateUp( clientId, initialPosition ) {
				selectBlock( clientId, initialPosition );
			},
		};
	} ),
] )( FloatingToolbar );
