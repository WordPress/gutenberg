/**
 * External dependencies
 */
import React from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import styles from './styles.module.css';

const FeatureList = [
	{
		title: 'Easy to Use',
		Svg: require( '@site/static/img/undraw_docusaurus_mountain.svg' )
			.default,
		description: (
			<>
				Gutenberg was designed from the ground up to be easily installed
				and used for your authors.
			</>
		),
	},
	{
		title: 'Flexible',
		Svg: require( '@site/static/img/undraw_docusaurus_tree.svg' ).default,
		description: (
			<>
				Gutenberg as a platform allows you to custumize the UI of your
				block editor as you wish.
			</>
		),
	},
	{
		title: 'Powered by React',
		Svg: require( '@site/static/img/undraw_docusaurus_react.svg' ).default,
		description: <>Extend or customize your block editor using React.</>,
	},
];

function Feature( { Svg, title, description } ) {
	return (
		<div className={ clsx( 'col col--4' ) }>
			<div className="text--center">
				<Svg className={ styles.featureSvg } role="img" />
			</div>
			<div className="text--center padding-horiz--md">
				<h3>{ title }</h3>
				<p>{ description }</p>
			</div>
		</div>
	);
}

export default function HomepageFeatures() {
	return (
		<section className={ styles.features }>
			<div className="container">
				<div className="row">
					{ FeatureList.map( ( props, idx ) => (
						<Feature key={ idx } { ...props } />
					) ) }
				</div>
			</div>
		</section>
	);
}
