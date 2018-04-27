/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockTitle from '../block-title';
import BlockSelectParent from '../block-select-parent';

/**
 * Block breadcrumb component, displaying the label of the block. If the block
 * descends from a root block, a button is displayed enabling the user to select
 * the root block.
 *
 * @param {string}   props.uid             UID of block.
 * @param {string}   props.rootUID         UID of block's root.
 * @param {Function} props.selectRootBlock Callback to select root block.
 */
export default class BlockBreadcrumb extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isFocused: false,
		};
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onFocus( ) {
		this.setState( {
			isFocused: true,
		} );
	}

	onBlur() {
		this.setState( {
			isFocused: false,
		} );
	}

	render( ) {
		const { uid, isHidden } = this.props;
		const { isFocused } = this.state;

		return (
			<div className={ classnames( 'editor-block-list__breadcrumb', {
				'is-visible': ! isHidden || isFocused,
			} ) }>
				<Toolbar>
					<BlockSelectParent
						uid={ uid }
						onFocus={ this.onFocus }
						onBlur={ this.onBlur }
					/>
					<BlockTitle uid={ uid } />
				</Toolbar>
			</div>
		);
	}
}
