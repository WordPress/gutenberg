/**
 * External Dependencies
 */
import { map } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostItemDraggable from './post-item-draggable';

class PostsList extends Component {
	constructor() {
		super( ...arguments );

		this.onDragStart = this.onDragStart.bind( this );
		this.onDragEnd = this.onDragEnd.bind( this );

		this.state = {
			dragging: false,
		};
	}

	onDragStart() {
		this.setState( { dragging: true } );
	}

	onDragEnd() {
		this.setState( { dragging: false } );
	}

	renderPosts() {
		const { dragging } = this.state;
		const { posts } = this.props;

		return map( posts, ( post ) => {
			const elementId = `post-item-${ post.id }`;

			return (
				<li id={ elementId } className="components-posts-list-item" key={ post.id }>
					<PostItemDraggable
						post={ post }
						onDragStart={ this.onDragStart }
						onDragEnd={ this.onDragEnd }
						isDragging={ dragging }
						elementId={ elementId }
					/>
					<div className="components-posts-list-item-title">{ post.title.rendered }</div>
				</li>
			);
		} );
	}

	render() {
		return (
			<ul className="components-posts-list">
				{ this.renderPosts() }
			</ul>
		);
	}
}

export default PostsList;
