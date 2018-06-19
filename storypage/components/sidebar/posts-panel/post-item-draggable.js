/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { withSelect } from '@wordpress/data';

class PostItemDraggable extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			block: { },
		};
	}

	componentDidMount() {
		const { post } = this.props;

		if ( ! this.state.block.uid ) {
			// create a new block
			const block = createBlock( 'storypage/post', {
				title: [ post.title.rendered ],
				id: post.featured_media,
				link: post.link,
				layout: '',
			} );

			this.setState( { block } );
		}
	}

	render() {
		const { isDragging, ...props } = this.props;
		const { index, rootUID } = this.props.insertionPoint;
		const { block } = this.state;

		if ( ! block.uid ) {
			return '';
		}

		const className = classnames( 'components-posts-list-item-draggable', {
			'is-visible': isDragging,
		} );

		const transferData = {
			type: 'block',
			fromIndex: index,
			rootUID,
			uid: block.uid,
			layout: block.layout,
			blocks: [ { ...block } ],
		};

		return (
			<Draggable className={ className } transferData={ transferData } { ...props }>
				<div className="components-posts-list-item-draggable-inner"></div>
			</Draggable>
		);
	}
}

export default compose( [
	withSelect( ( select ) => ( {
		insertionPoint: select( 'core/editor' ).getBlockInsertionPoint(),
	} ) ),
] )( PostItemDraggable );
