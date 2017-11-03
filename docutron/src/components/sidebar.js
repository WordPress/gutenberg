/**
 * External Dependencies
 */
import React, { Component } from 'react';

/**
 * Internal Dependencies
 */
import MenuItem from './menu-item';
import { getStories } from '../config';

class Sidebar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			searchValue: '',
		};
		this.onChangeSearchValue = this.onChangeSearchValue.bind( this );
	}

	onChangeSearchValue( event ) {
		this.setState( { searchValue: event.target.value } );
	}

	render() {
		const searchResults = this.state.searchValue ?
			getStories()
				.filter( ( story ) => story.title.toLowerCase().indexOf( this.state.searchValue.toLowerCase() ) !== -1 ) :
			null;

		return (
			<div id="secondary" className="widget-area">
				<div className="secondary-content">
					<aside className="widget widget_search">
						<form
							id="searchform"
							className="searchform"
							role="search"
							onSubmit={ ( event ) => event.preventDefault() }>
							<label htmlFor="s" className="screen-reader-text">Filter</label>
							<input
								type="search"
								className="field"
								name="s"
								value={ this.state.searchValue }
								id="s"
								placeholder="Filter …"
								onChange={ this.onChangeSearchValue }
							/>
							<input type="submit" className="submit" id="searchsubmit" value="Filter" />
						</form>
					</aside>

					<aside id="handbook" className="widget widget_wporg_handbook_pages">
						<h2 className="widget-title">Chapters</h2>
						<div className="menu-table-of-contents-container">
							<ul>
								{ getStories()
									.filter( ( story ) => ! story.parent )
									.map( ( story, index ) => (
										<MenuItem key={ index } item={ story } searchResults={ searchResults } />
									) )
								}
							</ul>
						</div>
					</aside>
				</div>
			</div>
		);
	}
}

export default Sidebar;
