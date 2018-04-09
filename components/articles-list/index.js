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
import ArticleItemDraggable from './article-item-draggable';

class ArticlesList extends Component {
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

	renderArticles() {
		const { dragging } = this.state;
		const { articles } = this.props;

		return map( articles, article => {
			const elementId = `article-item-${ article.id }`;

			return (
				<li id={ elementId } className="components-articles-list-item" key={ article.id }>
					<ArticleItemDraggable
						article={ article }
						onDragStart={ this.onDragStart }
						onDragEnd={ this.onDragEnd }
						isDragging={ dragging }
						elementId={ elementId }
					/>
					<div className="components-articles-list-item-title">{ article.title.rendered }</div>
				</li>
			);
		} );
	}

	render() {
		return (
			<ul className="components-articles-list">
				{ this.renderArticles() }
			</ul>
		);
	}
}

export default ArticlesList;
