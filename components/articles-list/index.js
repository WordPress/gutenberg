/**
 * External Dependencies
 */
import { map } from 'lodash';
import classnames from 'classnames';

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
			dragging: false
		}
	}

	onDragStart() {
		this.setState( { dragging: true } );
	}

	onDragEnd() {
		this.setState( { dragging: false } );
	}

	renderArticles() {
		const { dragging } = this.state;

		return map( this.props.articles, article => {
			const elementId = `article-item-${ article.id }`;

			return (				
				<li id={ elementId } className="components-articles-list-item" key={ article.id }>
					<ArticleItemDraggable
						// rootUID={ rootUID }
						// index={ order }
						// uid={ uid }
						// layout={ layout }
						onDragStart={ this.onDragStart }
						onDragEnd={ this.onDragEnd }
						isDragging={ dragging }
						elementId={ elementId }
					/>
					<div>{ article.title.rendered }</div>
				</li>
			);
		} );
	}

	render() {
		const { isDragging } = this.props;

		return (
			<ul className="components-articles-list">
				{ this.renderArticles() }
			</ul>
		);
	}
}

export default ArticlesList;
