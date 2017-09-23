/**
 * External Dependencies
 */
import React from 'react';

const header = (
	<header id="masthead" className="site-header" role="banner">
		<div className="site-branding">
			<p className="site-title">
				<a href="/" rel="home">
					Gutenberg Docs
				</a>
			</p>
			<nav className="gutenberg-links">
				<a href="https://wordpress.org/plugins/gutenberg/">
					Download Plugin
				</a>
				<a href="https://github.com/WordPress/gutenberg/">
					View on GitHub
				</a>
			</nav>
		</div>
	</header>
);

export default () => header;
