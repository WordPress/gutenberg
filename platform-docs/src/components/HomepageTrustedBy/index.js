/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.css';

const Users = [
	{
		title: 'WordPress',
		img: require( '@site/static/img/wordpress.png' ).default,
		height: 60,
	},
	{
		title: 'Tumblr',
		img: require( '@site/static/img/tumblr.png' ).default,
		height: 18,
	},
	{
		title: 'Day One',
		img: require( '@site/static/img/dayone.png' ).default,
		height: 100,
	},
];

function User( { img, title, height } ) {
	return (
		<div className={ styles.col }>
			<img src={ img } alt={ title } style={ { height } } />
		</div>
	);
}

export default function HomepageTrustedBy() {
	return (
		<section className={ styles.container }>
			<div>
				<h2 className={ styles.title }>Trusted by</h2>
				<div className={ styles.row }>
					{ Users.map( ( props, idx ) => (
						<User key={ idx } { ...props } />
					) ) }
				</div>
			</div>
		</section>
	);
}
