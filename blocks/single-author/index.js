
/**
 * External Depenedencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function SingleAuthor( { avatar, bio, className, name } ) {
	const classes = classnames(
		className,
		'blocks-single-author',
		{
			'with-bio': bio,
			'no-bio': ! bio,
		}
	);
	return (
		<section className={ classes }>
			{ name && <h2> { name }</h2> }
			{ ( avatar || bio ) && (
				<p>
					{ avatar && <img src={ avatar } alt={ __( 'avatar' ) } className={ bio ? 'alignleft' : 'aligncenter' } /> }
					{ bio }
				</p>
			) }
		</section>
	);
}

export default SingleAuthor;
