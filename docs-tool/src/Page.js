import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Prism from 'prismjs';

import { getNextStory, getPreviousStory } from 'glutenberg';

class Page extends Component {
	componentDidMount() {
		Prism.highlightAll();
	}

	render() {
		const { story } = this.props;
		const nextStory = getNextStory( story.id );
		const previousStory = getPreviousStory( story.id );
		const Comp = story.Component;

		return (
			<div>
				<Comp />

				<div className="navigation">
					{ !! previousStory && (
						<p className="nav-older">
							<Link to={ previousStory.path }>{ '←' } { previousStory.title }</Link>
						</p>
					) }
					{ !! nextStory && (
						<p className="nav-newer">
							<Link to={ nextStory.path }>{ nextStory.title } { '→' }</Link>
						</p>
					) }
				</div>
			</div>
		);
	}
}

export default Page;
