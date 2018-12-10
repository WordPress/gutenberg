/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { Component } from '@wordpress/element';
import {
	getBlockType,
	createBlock,
	rawHandler,
} from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Warning from '../warning';
import BlockCompare from '../block-compare';

export class BlockInvalidWarning extends Component {
	constructor( props ) {
		super( props );

		this.state = { compare: false };
		this.onCompare = this.onCompare.bind( this );
		this.onCompareClose = this.onCompareClose.bind( this );
	}

	onCompare() {
		this.setState( { compare: true } );
	}

	onCompareClose() {
		this.setState( { compare: false } );
	}

	render() {
		const { convertToHTML, convertToBlocks, convertToClassic, block } = this.props;
		const hasHTMLBlock = !! getBlockType( 'core/html' );
		const { compare } = this.state;
		const hiddenActions = [
			{ title: __( 'Convert to Classic Block' ), onClick: convertToClassic },
		];

		if ( compare ) {
			return (
				<Modal
					title={
						// translators: Dialog title to fix block content
						__( 'Resolve Block' )
					}
					onRequestClose={ this.onCompareClose }
					className="editor-block-compare"
				>
					<BlockCompare
						block={ block }
						onKeep={ convertToHTML }
						onConvert={ convertToBlocks }
						convertor={ blockToBlocks }
						convertButtonText={ __( 'Convert to Blocks' ) }
					/>
				</Modal>
			);
		}

		return (
			<Warning
				actions={ [
					<Button key="convert" onClick={ this.onCompare } isLarge isPrimary={ ! hasHTMLBlock }>
						{
							// translators: Button to fix block content
							_x( 'Resolve', 'imperative verb' )
						}
					</Button>,
					hasHTMLBlock && (
						<Button key="edit" onClick={ convertToHTML } isLarge isPrimary>
							{ __( 'Convert to HTML' ) }
						</Button>
					),
				] }
				secondaryActions={ hiddenActions }
			>
				{ __( 'This block contains unexpected or invalid content.' ) }
			</Warning>
		);
	}
}

const blockToClassic = ( block ) => createBlock( 'core/freeform', {
	content: block.originalContent,
} );
const blockToHTML = ( block ) => createBlock( 'core/html', {
	content: block.originalContent,
} );
const blockToBlocks = ( block ) => rawHandler( {
	HTML: block.originalContent,
} );

export default compose( [
	withSelect( ( select, { clientId } ) => ( {
		block: select( 'core/editor' ).getBlock( clientId ),
	} ) ),
	withDispatch( ( dispatch, { block } ) => {
		const { replaceBlock } = dispatch( 'core/editor' );

		return {
			convertToClassic() {
				replaceBlock( block.clientId, blockToClassic( block ) );
			},
			convertToHTML() {
				replaceBlock( block.clientId, blockToHTML( block ) );
			},
			convertToBlocks() {
				replaceBlock( block.clientId, blockToBlocks( block ) );
			},
		};
	} ),
] )( BlockInvalidWarning );
