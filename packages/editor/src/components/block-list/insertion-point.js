/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

class BlockInsertionPoint extends Component {
	constructor() {
		super( ...arguments );

		this.onBlurInserter = this.onBlurInserter.bind( this );
		this.onFocusInserter = this.onFocusInserter.bind( this );
		this.toggleIsInserterHovered = this.toggleIsInserterHovered.bind( this );
		this.toggleIsInserterOpened = this.toggleIsInserterOpened.bind( this );

		this.inserterWrapperRef = createRef();

		this.state = {
			isInserterFocused: false,
			isInserterHovered: false,
			isInserterOpened: false,
		};
	}

	componentDidUpdate() {
		if ( this.forceFocusToInserter ) {
			delete this.forceFocusToInserter;

			const tabbable = focus.tabbable.find( this.inserterWrapperRef.current )[ 0 ];
			if ( tabbable ) {
				tabbable.focus();
			}
		}
	}

	onFocusInserter( event ) {
		// Stop propagation of the focus event to avoid selecting the current
		// block while inserting a new block, as it is not relevant to sibling
		// insertion and conflicts with contextual toolbar placement.
		event.stopPropagation();

		if ( this.state.isInserterFocused ) {
			return;
		}

		const isFocusOnInserterWrapper = event.target === event.currentTarget;
		if ( isFocusOnInserterWrapper ) {
			this.forceFocusToInserter = true;
		}

		this.setState( {
			isInserterFocused: true,
		} );
	}

	onBlurInserter( event ) {
		if ( event.target === this.inserterWrapperRef.current ) {
			return;
		}

		if ( ! this.state.isInserterFocused ) {
			return;
		}

		this.setState( {
			isInserterFocused: false,
		} );
	}

	toggleIsInserterHovered( event ) {
		this.setState( {
			isInserterHovered: event.type === 'mouseenter',
		} );
	}

	toggleIsInserterOpened( isOpen ) {
		this.setState( {
			isInserterOpened: isOpen,
		} );
	}

	render() {
		const {
			isInserterFocused,
			isInserterHovered,
			isInserterOpened,
		} = this.state;
		const {
			showInsertionPoint,
			rootClientId,
			insertIndex,
		} = this.props;

		const isInserterVisible = isInserterFocused || isInserterHovered || isInserterOpened;

		return (
			<div className="editor-block-list__insertion-point">
				{ showInsertionPoint && (
					<div className="editor-block-list__insertion-point-indicator" />
				) }
				<div
					ref={ this.inserterWrapperRef }
					onFocus={ this.onFocusInserter }
					onBlur={ this.onBlurInserter }
					onMouseEnter={ this.toggleIsInserterHovered }
					onMouseLeave={ this.toggleIsInserterHovered }
					tabIndex={ 0 }
					className={
						classnames( 'editor-block-list__insertion-point-inserter', {
							'is-visible': isInserterVisible,
						} )
					}
				>
					{ isInserterVisible && (
						<Inserter
							rootClientId={ rootClientId }
							index={ insertIndex }
							onToggle={ this.toggleIsInserterOpened }
						/>
					) }
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
	const insertIndex = blockIndex;
	const insertionPoint = getBlockInsertionPoint();
	const showInsertionPoint = (
		isBlockInsertionPointVisible() &&
		insertionPoint.index === insertIndex &&
		insertionPoint.rootClientId === rootClientId
	);

	return { showInsertionPoint, insertIndex };
} )( BlockInsertionPoint );
