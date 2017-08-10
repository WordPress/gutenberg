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

function InvalidBlockWarning( { ignoreInvalid, switchToDefaultType } ) {
	const defaultBlockType = getBlockType( getUnknownTypeHandlerName() );

	return (
		<BlockWarning>
			<p>{ sprintf( __(
				'This block appears to have been modified externally. ' +
				'Overwrite the external changes or Convert to %s to keep ' +
				'your changes.'
			), defaultBlockType.title ) }</p>
			<p>
				<Button
					onClick={ ignoreInvalid }
					isLarge
				>
					{ sprintf( __( 'Overwrite' ) ) }
				</Button>
				{ defaultBlockType && (
					<Button
						onClick={ switchToDefaultType }
						isLarge
					>
						{
							/* translators: Revert invalid block to default */
							sprintf( __( 'Convert to %s' ), defaultBlockType.title )
						}
					</Button>
				) }
			</p>
		</BlockWarning>
	);
}

export default connect(
	null,
	( dispatch, ownProps ) => {
		return {
			ignoreInvalid() {
				const { block } = ownProps;
				const { name, attributes } = block;
				const nextBlock = createBlock( name, attributes );
				dispatch( replaceBlock( block.uid, nextBlock ) );
			},
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
