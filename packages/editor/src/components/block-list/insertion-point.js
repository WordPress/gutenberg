/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

class BlockInsertionPoint extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isInserterFocused: false,
		};

		this.onBlurInserter = this.onBlurInserter.bind( this );
		this.onFocusInserter = this.onFocusInserter.bind( this );
	}

	onFocusInserter( event ) {
		// Stop propagation of the focus event to avoid selecting the current
		// block while inserting a new block, as it is not relevant to sibling
		// insertion and conflicts with contextual toolbar placement.
		event.stopPropagation();

		this.setState( {
			isInserterFocused: true,
		} );
	}

	onBlurInserter() {
		this.setState( {
			isInserterFocused: false,
		} );
	}

	render() {
		const { isInserterFocused } = this.state;
		const {
			showInsertionPoint,
			rootClientId,
			clientId,
		} = this.props;

		return (
			<div className="editor-block-list__insertion-point">
				{ showInsertionPoint && (
					<div className="editor-block-list__insertion-point-indicator" />
				) }
				<div
					onFocus={ this.onFocusInserter }
					onBlur={ this.onBlurInserter }
					// While ideally it would be enough to capture the
					// bubbling focus event from the Inserter, due to the
					// characteristics of click focusing of `button`s in
					// Firefox and Safari, it is not reliable.
					//
					// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
					tabIndex={ -1 }
					className={
						classnames( 'editor-block-list__insertion-point-inserter', {
							'is-visible': isInserterFocused,
						} )
					}
				>
					<Inserter
						rootClientId={ rootClientId }
						clientId={ clientId }
					/>
				</div>
			</div>
		);
	}
}
export default withSelect( ( select, { clientId, rootClientId } ) => {
	const {
		getBlockIndex,
		getBlockInsertionPoint,
		isBlockInsertionPointVisible,
	} = select( 'core/editor' );
	const blockIndex = getBlockIndex( clientId, rootClientId );
	const insertionPoint = getBlockInsertionPoint();
	const showInsertionPoint = (
		isBlockInsertionPointVisible() &&
		insertionPoint.index === blockIndex &&
		insertionPoint.rootClientId === rootClientId
	);

	return { showInsertionPoint };
} )( BlockInsertionPoint );
