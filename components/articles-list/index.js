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

class ArticlesList extends Component {
	renderArticles() {
		return map( this.props.articles, article => {
			return ( <li className="components-articles-list-item" key={ article.id }>{ article.title.rendered }</li> );
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
