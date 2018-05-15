/**
 * WordPress dependencies
 */
import { Component, Fragment, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { withSafeTimeout } from '@wordpress/components';
import { getRectangleFromRange } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import InlineInsertionPoint from './inline-insertion-point';
import MediaUpload from '../media-upload';

class InlineBlocks extends Component {
	constructor() {
		super( ...arguments );

		this.insert = this.insert.bind( this );
		this.getInsertPosition = this.getInsertPosition.bind( this );
		this.onSelectMedia = this.onSelectMedia.bind( this );
		this.openMediaLibrary = this.openMediaLibrary.bind( this );
		this.closeMediaLibrary = this.closeMediaLibrary.bind( this );
		this.state = { mediaLibraryOpen: false };
	}

	componentDidMount() {
		const { setTimeout, setInsertAvailable } = this.props;

		// When moving between two different RichText with the keyboard, we need to
		// make sure `setInsertAvailable` is called after `setInsertUnavailable`
		// from previous RichText so that editor state is correct
		setTimeout( setInsertAvailable );
	}

	componentDidUpdate( prevProps ) {
		if (
			this.props.inlineBlockForInsert &&
			! prevProps.inlineBlockForInsert
		) {
			this.insert();
		}
	}

	componentWillUnmount() {
		this.props.setInsertUnavailable();
	}

	getInsertPosition() {
		const { containerRef, editor } = this.props;

		// The container is relatively positioned.
		const containerPosition = containerRef.current.getBoundingClientRect();
		const rect = getRectangleFromRange( editor.selection.getRng() );

		return {
			top: rect.top - containerPosition.top,
			left: rect.right - containerPosition.left,
			height: rect.height,
		};
	}

	insert() {
		const {
			inlineBlockForInsert,
			completeInsert,
			editor,
		} = this.props;

		if ( inlineBlockForInsert.type === 'image' ) {
			this.openMediaLibrary();
		} else {
			editor.insertContent( inlineBlockForInsert.render() );
			completeInsert();
		}
	}

	onSelectMedia( media ) {
		const {
			editor,
			inlineBlockForInsert,
			completeInsert,
		} = this.props;
		const img = inlineBlockForInsert.render( media );

		editor.insertContent( img );
		completeInsert();
		this.closeMediaLibrary();
	}

	openMediaLibrary() {
		this.setState( { mediaLibraryOpen: true } );
	}

	closeMediaLibrary() {
		this.setState( { mediaLibraryOpen: false } );
	}

	render() {
		const { isInlineInsertionPointVisible } = this.props;
		const { mediaLibraryOpen } = this.state;

		return (
			<Fragment>
				{ isInlineInsertionPointVisible &&
					<InlineInsertionPoint
						style={ this.getInsertPosition() }
					/>
				}
				{ mediaLibraryOpen &&
					<MediaUpload
						type="image"
						onSelect={ this.onSelectMedia }
						onClose={ this.closeMediaLibrary }
						render={ ( { open } ) => {
							open();
							return null;
						} }
					/>
				}
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isInlineInsertionPointVisible,
			getInlineBlockForInsert,
		} = select( 'core/editor' );

		return {
			isInlineInsertionPointVisible: isInlineInsertionPointVisible(),
			inlineBlockForInsert: getInlineBlockForInsert(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			setInlineInsertAvailable,
			setInlineInsertUnavailable,
			completeInlineInsert,
		} = dispatch( 'core/editor' );

		return {
			setInsertAvailable: setInlineInsertAvailable,
			setInsertUnavailable: setInlineInsertUnavailable,
			completeInsert: completeInlineInsert,
		};
	} ),
	withSafeTimeout,
] )( InlineBlocks );
