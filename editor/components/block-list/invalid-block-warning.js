/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import {
	getBlockType,
	createBlock,
	rawHandler,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { replaceBlock } from '../../store/actions';
import Warning from '../warning';

function InvalidBlockWarning( { block, onReplace } ) {
	const hasHTMLBlock = !! getBlockType( 'core/html' );

	const convertToHTML = () => {
		onReplace( block.uid, createBlock( 'core/html', {
			content: block.originalContent,
		} ) );
	};

	const convertToBlocks = () => {
		onReplace( block.uid, rawHandler( {
			HTML: block.originalContent,
			mode: 'BLOCKS',
		} ) );
	};

	return (
		<Warning>
			<p>{ __( 'This block appears to have been modified externally.' ) }</p>
			<p>
				<Button onClick={ convertToBlocks } isLarge isPrimary={ ! hasHTMLBlock }>
					{ __( 'Convert to Blocks' ) }
				</Button>
				{ hasHTMLBlock && (
					<Button onClick={ convertToHTML } isLarge isPrimary>
						{ __( 'Edit as HTML' ) }
					</Button>
				) }
			</p>
		</Warning>
	);
}

export default connect(
	null,
	{
		onReplace: replaceBlock,
	}
)( InvalidBlockWarning );
