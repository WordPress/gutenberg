/**
 * External dependencies
 */
import { connect } from 'react-redux';

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
		this.instanceId = this.constructor.instances++;
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
			this.setState( { filterValue: '' } );
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
								<div
									className="editor-inserter__separator"
									id={ `editor-inserter__separator-${ category.slug }-${ this.instanceId }` }
									aria-hidden="true"
								>
									{ category.title }
								</div>
								<div
									className="editor-inserter__category-blocks"
									role="menu"
									tabIndex="0"
									aria-labelledby={ `editor-inserter__separator-${ category.slug }-${ this.instanceId }` }
								>
									{ blocksByCategory[ category.slug ].map( ( { slug, title, icon } ) => (
										<button
											role="menuitem"
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
				<label htmlFor={ `editor-inserter__search-${ this.instanceId }` } className="screen-reader-text">
					{ wp.i18n.__( 'Search blocks' ) }
				</label>
				<input
					id={ `editor-inserter__search-${ this.instanceId }` }
					type="search"
					placeholder={ wp.i18n.__( 'Search…' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
				/>
			</div>
		);
	}
}

InserterMenu.instances = 0;

export default connect(
	undefined,
	( dispatch ) => ( {
		onInsertBlock( slug ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				block: wp.blocks.createBlock( slug )
			} );
		}
	} )
)( InserterMenu );
