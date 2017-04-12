/**
 * External dependencies
 */
import { connect } from 'react-redux';
import uuid from 'uuid/v4';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from 'components/dashicon';

class InserterMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.state = {
			filterValue: ''
		};
		this.filter = this.filter.bind( this );
	}

	filter( event ) {
		this.setState( {
			filterValue: event.target.value
		} );
	}

	selectBlock( slug ) {
		return () => {
			this.props.onInsertBlock( slug );
			this.props.onSelect();
		};
	}

	render() {
		const { position = 'top' } = this.props;
		const blocks = wp.blocks.getBlocks();
		const isShownBlock = block => block.title.toLowerCase().indexOf( this.state.filterValue.toLowerCase() ) !== -1;
		const blocksByCategory = blocks.reduce( ( groups, block ) => {
			if ( ! isShownBlock( block ) ) {
				return groups;
			}
			if ( ! groups[ block.category ] ) {
				groups[ block.category ] = [];
			}
			groups[ block.category ].push( block );
			return groups;
		}, {} );
		const categories = wp.blocks.getCategories();

		return (
			<div className={ `editor-inserter__menu is-${ position }` }>
				<div className="editor-inserter__arrow" />
				<div className="editor-inserter__content">
					{ categories
						.map( ( category ) => !! blocksByCategory[ category.slug ] && (
							<div key={ category.slug }>
								<div className="editor-inserter__separator">{ category.title }</div>
								<div className="editor-inserter__category-blocks">
									{ blocksByCategory[ category.slug ].map( ( { slug, title, icon } ) => (
										<button
											key={ slug }
											className="editor-inserter__block"
											onClick={ this.selectBlock( slug ) }
										>
											<Dashicon icon={ icon } />
											{ title }
										</button>
									) ) }
								</div>
							</div>
						) )
					}
				</div>
				<input
					type="search"
					placeholder={ wp.i18n.__( 'Search…' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
				/>
			</div>
		);
	}
}

export default connect(
	undefined,
	( dispatch ) => ( {
		onInsertBlock( slug ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				block: {
					uid: uuid(),
					blockType: slug,
					attributes: {}
				}
			} );
		}
	} )
)( InserterMenu );
