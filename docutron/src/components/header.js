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
		</div>
		<nav id="site-navigation" className="navigation-main clear">
			<div className="menu-navigation-container">
				<ul id="menu-navigation" className="menu">
					<li className="menu-item">
						<a title="View on GitHub" href="https://github.com/WordPress/gutenberg/">
							<span className="screen-reader-text">View on GitHub</span>
							<svg
								viewBox="0 0 16 16"
								xmlns="http://www.w3.org/2000/svg"
								fillRule="evenodd"
								clipRule="evenodd"
								strokeLinejoin="round"
								strokeMiterlimit="1.414"
								width="20"
								height="20"
								fill="#fff"
								style={ { verticalAlign: 'middle' } }
							>
								<path d="M8 0C3.58 0 0 3.582 0 8c0 3.535 2.292 6.533 5.47 7.59.4.075.547-.172.547-.385 0-.19-.007-.693-.01-1.36-2.226.483-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.725-.496.056-.486.056-.486.803.056 1.225.824 1.225.824.714 1.223 1.873.87 2.33.665.072-.517.278-.87.507-1.07-1.777-.2-3.644-.888-3.644-3.953 0-.873.31-1.587.823-2.147-.09-.202-.36-1.015.07-2.117 0 0 .67-.215 2.2.82.64-.178 1.32-.266 2-.27.68.004 1.36.092 2 .27 1.52-1.035 2.19-.82 2.19-.82.43 1.102.16 1.915.08 2.117.51.56.82 1.274.82 2.147 0 3.073-1.87 3.75-3.65 3.947.28.24.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38C13.71 14.53 16 11.53 16 8c0-4.418-3.582-8-8-8" />
							</svg>
						</a>
					</li>
				</ul>
			</div>
		</nav>
	</header>
);

export default () => header;
