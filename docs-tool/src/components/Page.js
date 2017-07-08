import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Prism from 'prismjs';

import { getNextStory, getPreviousStory } from 'glutenberg';
import markdown from '../markdown';

class Tabs extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			activeTab: 0,
		};
	}

	selectTab( index ) {
		return () => {
			this.setState( { activeTab: index } );
		};
	}

	componentDidUpdate() {
		Prism.highlightAll();
	}

	render() {
		const { tabs } = this.props;
		const activeTab = tabs[ this.state.activeTab ];

		return (
			<div>
				{ tabs.map( ( tab, index ) => (
					<button
						key={ index }
						onClick={ this.selectTab( index ) }
						className={ index === this.state.activeTab ? 'is-active' : '' }
					>
						{ tab.name }
					</button>
				) ) }
				{ activeTab && <div dangerouslySetInnerHTML={ { __html: activeTab.content } } /> }
			</div>
		);
	}
}

function MarkdownContent( { content } ) {
	const blocks = markdown( content );

	return (
		<div>
			{ blocks.map( ( block, index ) => {
				if ( block.type === 'raw' ) {
					return <div key={ index } dangerouslySetInnerHTML={ { __html: block.content } } />;
				}
				if ( block.type === 'codetabs' ) {
					return <Tabs key={ index } tabs={ block.tabs } />;
				}

				return null;
			} ) }
		</div>
	);
}

class Page extends Component {
	componentDidMount() {
		Prism.highlightAll();
	}

	render() {
		const { story } = this.props;
		const nextStory = getNextStory( story.id );
		const previousStory = getPreviousStory( story.id );

		return (
			<div>
				{ !! story.Component && <story.Component /> }
				{ !! story.markdown && <MarkdownContent content={ story.markdown } /> }

				<div className="navigation">
					{ !! previousStory && (
						<p className="nav-older" rel="previous">
							<Link to={ previousStory.path }>{ '←' } { previousStory.title }</Link>
						</p>
					) }
					{ !! nextStory && (
						<p className="nav-newer" rel="next">
							<Link to={ nextStory.path }>{ nextStory.title } { '→' }</Link>
						</p>
					) }
				</div>
			</div>
		);
	}
}

export default Page;
