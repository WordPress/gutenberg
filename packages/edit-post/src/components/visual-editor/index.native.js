/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { BlockList } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Header from './header';

export default class VisualEditor extends Component {
	constructor( props ) {
		super( props );
		this.renderHeader = this.renderHeader.bind( this );
	}

	renderHeader() {
		const { setTitleRef } = this.props;
		return <Header setTitleRef={ setTitleRef } />;
	}

	render() {
		const { safeAreaBottomInset, isCompactMode } = this.props;

		return (
			<BlockList
				{ ...( ! isCompactMode && { render: this.renderHeader } ) }
				safeAreaBottomInset={ safeAreaBottomInset }
			/>
		);
	}
}
