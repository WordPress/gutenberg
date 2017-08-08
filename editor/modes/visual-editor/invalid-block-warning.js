/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockWarning from './block-warning';
import {
	getBlockType,
	getUnknownTypeHandlerName,
	createBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { replaceBlock } from '../../actions';

function InvalidBlockWarning( { switchToDefaultType } ) {
	const defaultBlockType = getBlockType( getUnknownTypeHandlerName() );

	return (
		<BlockWarning>
			<p>{ __(
				'This block has been modified externally and has been locked to ' +
				'protect against content loss.'
			) }</p>
			{ defaultBlockType && (
				<p>
					<Button
						onClick={ switchToDefaultType }
						isLarge
					>
						{
							/* translators: Revert invalid block to default */
							sprintf( __( 'Convert to %s' ), defaultBlockType.title )
						}
					</Button>
				</p>
			) }
		</BlockWarning>
	);
}

export default connect(
	null,
	( dispatch, ownProps ) => {
		return {
			switchToDefaultType() {
				const defaultBlockName = getUnknownTypeHandlerName();
				const { block } = ownProps;
				if ( defaultBlockName && block ) {
					const nextBlock = createBlock( defaultBlockName, {
						content: block.originalContent,
					} );

					dispatch( replaceBlock( block.uid, nextBlock ) );
				}
			},
		};
	}
)( InvalidBlockWarning );
