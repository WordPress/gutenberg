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
		img: require( '@site/static/img/block-media-text.png' ).default,
		description: (
			<>
				Gutenberg was designed from the ground up to be easily installed
				and used for your authors.
			</>
		),
	},
	{
		title: 'Flexible',
		img: require( '@site/static/img/plugin-icon.png' ).default,
		description: (
			<>
				Gutenberg allows you to customize the UI of your block editor as
				you wish.
			</>
		),
	},
	{
		title: 'Multi devices',
		img: require( '@site/static/img/mobile-icon.png' ).default,
		description: <>Work across screen sizes and devices.</>,
	},
	{
		title: 'Powered by React',
		svg: require( '@site/static/img/react-icon.svg' ).default,
		description: <>Extend or customize your block editor using React.</>,
	},
];

function Feature( { svg: Svg, img, title, description } ) {
	return (
		<div className={ styles.feature }>
			<div>
				{ !! Svg && <Svg className={ styles.featureSvg } role="img" /> }
				{ !! img && (
					<img
						className={ styles.featureSvg }
						src={ img }
						alt={ title }
					/>
				) }
			</div>
			<h3 className={ styles.title }>{ title }</h3>
			<p>{ description }</p>
		</div>
	);
}

export default function HomepageFeatures() {
	return (
		<section className={ styles.features }>
			<div className={ clsx( 'container', styles.grid ) }>
				{ FeatureList.map( ( props, idx ) => (
					<Feature key={ idx } { ...props } />
				) ) }
			</div>
		</section>
	);
}
