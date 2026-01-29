/**
 * External dependencies
 */
import React from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import styles from './styles.module.css';

export default function HomepageThanks() {
	return (
		<section className={ styles.thanks }>
			<div className={ clsx( 'container', styles.container ) }>
				<h2 className={ styles.title }>Thanks for trying Gutenberg.</h2>
				<div className={ styles.columns }>
					<p className={ styles.description }>
						Gutenberg is a project by the WordPress community. New
						developments and experiments will continue in the{ ' ' }
						<a href="http://github.com/wordPress/gutenberg/">
							Gutenberg repository
						</a>
						.
					</p>
					<div className={ styles.links }>
						<div>
							<a href="https://twitter.com/WordPress">
								Twitter ↗
							</a>
						</div>
						<div>
							<a href="http://github.com/wordPress/gutenberg/">
								GitHub ↗
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
