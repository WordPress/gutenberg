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
		title: 'Tumblr',
		img: require( '@site/static/img/tumblr.png' ).default,
	},
	{
		title: 'WordPress',
		img: require( '@site/static/img/wordpress.png' ).default,
	},
	{
		title: 'Day One',
		img: require( '@site/static/img/dayone.png' ).default,
	},
];

function User( { img, title } ) {
	return (
		<div className={ styles.col }>
			<img src={ img } alt={ title } />
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
