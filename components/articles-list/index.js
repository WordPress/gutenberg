/**
 * External Dependencies
 */
import { map, fromPairs } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { Component, compose } from '@wordpress/element';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
// import { removeBlock } from '';

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
			articlesBlocks: { },
		}
	}

	onDragStart() {
		this.setState( { dragging: true } );
	}

	onDragEnd() {
		this.setState( { dragging: false } );
	}

	componentWillReceiveProps( nextProps ) {
		if ( this.props.articles !== nextProps.articles ) {

			const oldArticlesBlocks = this.state.articlesBlocks;

			const articlesBlocks = fromPairs( 
				map( nextProps.articles, article => {
					// the block already exists 
					if ( oldArticlesBlocks[ article.id ] ) {
						return [ article.id, oldArticlesBlocks[ article.id ] ];
					}

					const item = {
						name: 'dynamic/article',
						initialAttributes: {
							url: article.image_url,
							title: [ article.title.rendered ],
							layout: '',
						},
					};

					const { name, initialAttributes, layout } = item;

					// create a new block
					const createdBlock = createBlock( name, { ...initialAttributes } );
					// insert it to state but hidden to the editor
					// this.props.onInsertBlock( { ...createdBlock, hidden: true } );

					return [ article.id, createdBlock ];
				} )
			);

			this.setState( { articlesBlocks } );
		}		
	}

	// componentWillUnmount() {
	// 	console.log( 'componentWillUnmount' );
		
	// 	map( this.props.articles, article => {
	// 		removeBlock( article.uid );
	// 	});

	// 	// remove created blocks
	// }

	renderArticles() {
		const { dragging, articlesBlocks } = this.state;
		const { articles } = this.props;
		const { index, rootUID } = this.props.insertionPoint;
		const layout = '';

		return map( articles, article => {
			const elementId = `article-item-${ article.id }`;
			
			return (				
				<li id={ elementId } className="components-articles-list-item" key={ article.id }>
					{ ( articlesBlocks[ article.id ] && <ArticleItemDraggable
						rootUID={ rootUID }
					    index={ index }
					 	layout={ layout }
						uid={ articlesBlocks[ article.id ].uid }
						onDragStart={ this.onDragStart }
						onDragEnd={ this.onDragEnd }
						isDragging={ dragging }
						elementId={ elementId }
						block={ articlesBlocks[ article.id ] }
					/> ) }
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

export default compose( [
	withSelect( ( select ) => ( {
		insertionPoint: select( 'core/editor' ).getBlockInsertionPoint(),
	} ) ),
	// withDispatch( ( dispatch, ownProps ) => ( {
	// 	onInsertBlock: ( insertedBlock ) => {
	// 		const { index, rootUID } = ownProps.insertionPoint;
	// 		return dispatch( 'core/editor' ).insertBlock( insertedBlock, index, rootUID );
	// 	},
	// } ) ),
] )( ArticlesList );
