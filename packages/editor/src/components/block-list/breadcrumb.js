/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Toolbar } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

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
 * @param {string}   props.rootClientId    Client ID of block's root.
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

	render() {
		const { clientId, rootClientId, isLight } = this.props;

		return (
			<div className={ classnames( 'editor-block-list__breadcrumb', {
				'is-light': isLight,
			} ) }>
				<Toolbar>
					{ rootClientId && (
						<Fragment>
							<BlockTitle clientId={ rootClientId } />
							<span className="editor-block-list__descendant-arrow" />
						</Fragment>
					) }
					<BlockTitle clientId={ clientId } />
				</Toolbar>
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getBlockRootClientId, getEditorSettings } = select( 'core/editor' );
		const { clientId } = ownProps;

		return {
			rootClientId: getBlockRootClientId( clientId ),
			isLight: getEditorSettings().hasFixedToolbar,
		};
	} ),
] )( BlockBreadcrumb );
