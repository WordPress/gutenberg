/**
 * External Dependeencies
 */
import { map } from 'lodash';

/**
 * WordPress Dependeencies
 */
import { Component } from '@wordpress/element';

class ArticlesList extends Component {
	renderArticles() {
		return map( this.props.articles, article => {
			return ( <li key={ article.id }>{ article.title.rendered }</li> );
		} );
	}

	render() {
		return (
			<ul>
				{ this.renderArticles() }
			</ul>
		);
	}
}

export default ArticlesList;
