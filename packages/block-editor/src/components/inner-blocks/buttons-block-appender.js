/**
 * WordPress dependencies
 */
import { withDispatch } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import withClientId from './with-client-id';
import styles from './style';
import { StyledButtonAppender } from '../button-block-appender';

function ButtonsAppender( { onAddNextButton } ) {
	return (
		<StyledButtonAppender
			onClick={ onAddNextButton }
			style={ styles.appender }
		/>
	);
}

export default compose( [
	withPreferredColorScheme,
	withClientId,
	withDispatch( ( dispatch, { clientId }, registry ) => {
		const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
		const { getBlocks } = registry.select( 'core/block-editor' );
		const innerBlocks = getBlocks( clientId );

		const extendedInnerBlocks = [
			...innerBlocks,
			createBlock( 'core/button' ),
		];

		return {
			onAddNextButton: () =>
				replaceInnerBlocks( clientId, extendedInnerBlocks, false ),
		};
	} ),
] )( ButtonsAppender );
