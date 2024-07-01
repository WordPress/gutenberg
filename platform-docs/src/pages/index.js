/**
 * External dependencies
 */
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

/**
 * Internal dependencies
 */
import styles from './index.module.css';
import HomepageTrustedBy from '../components/HomepageTrustedBy';
import HomepageBlocks from '../components/HomepageBlocks';
import HomepageThanks from '../components/HomepageThanks';

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<header className={ clsx( 'hero hero-secondary', styles.heroBanner ) }>
			<div className={ clsx( 'container', styles.container ) }>
				<div className={ styles.heroLogo }>
					<img
						src={
							require( '@site/static/img/gutenberg_icon.png' )
								.default
						}
						alt="Gutenberg"
						width="38"
						height="38"
					/>
				</div>
				<h1 className={ styles.heroTitle }>
					Say hello to Gutenberg, the block editor.
				</h1>
				<p className="hero__subtitle">{ siteConfig.tagline }</p>
				<div className={ styles.buttons }>
					<Link
						className="button button--primary button--outline"
						to="/docs/intro"
					>
						Getting started - 10min ⏱️
					</Link>
				</div>
			</div>
		</header>
	);
}

export default function Home() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout
			title={ `Hello from ${ siteConfig.title }` }
			description="Build block editors using Gutenberg as a Framework"
		>
			<HomepageHeader />
			<main>
				<HomepageFeatures />
				<HomepageBlocks />
				<HomepageThanks />
				<HomepageTrustedBy />
			</main>
		</Layout>
	);
}
