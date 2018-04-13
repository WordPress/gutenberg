/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { compose, Component } from '@wordpress/element';
import { Dashicon, Tooltip, Toolbar, Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import BlockTitle from '../block-title';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string}   props.uid             UID of block.
 * @param {string}   props.rootUID         UID of block's root.
 * @param {Function} props.selectRootBlock Callback to select root block.
 */
export class BlockBreadcrumb extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isFocused: false,
		};
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onFocus( event ) {
		this.setState( {
			isFocused: true,
		} );

		// This is used for improved interoperability
		// with the block's `onFocus` handler which selects the block, thus conflicting
		// with the intention to select the root block.
		event.stopPropagation();
	}

	onBlur() {
		this.setState( {
			isFocused: false,
		} );
	}

	render( ) {
		const { uid, rootUID, selectRootBlock, isHidden } = this.props;
		const { isFocused } = this.state;

		return (
			<NavigableToolbar className={ classnames( 'editor-block-list__breadcrumb', {
				'is-visible': ! isHidden || isFocused,
			} ) }>
				<Toolbar>
					{ rootUID && (
						<Tooltip text={ __( 'Select parent block' ) }>
							<Button
								onClick={ selectRootBlock }
								onFocus={ this.onFocus }
								onBlur={ this.onBlur }
							>
								<Dashicon icon="arrow-left-alt" uid={ uid } />
							</Button>
						</Tooltip>
					) }
					<BlockTitle uid={ uid } />
				</Toolbar>
			</NavigableToolbar>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getBlockRootUID } = select( 'core/editor' );
		const { uid } = ownProps;

		return {
			rootUID: getBlockRootUID( uid ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { rootUID } = ownProps;
		const { selectBlock } = dispatch( 'core/editor' );

		return {
			selectRootBlock: () => selectBlock( rootUID ),
		};
	} ),
] )( BlockBreadcrumb );
