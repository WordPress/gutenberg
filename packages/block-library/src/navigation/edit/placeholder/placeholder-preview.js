/**
 * External dependencies
 */
import classnames from 'classnames';

const PlaceholderPreview = ( { isLoading } ) => {
	return (
		<ul
			className={ classnames(
				'wp-block-navigation-placeholder__preview',
				{ 'is-loading': isLoading }
			) }
		>
			<li>&#8203;</li>
			<li>&#8203;</li>
			<li>&#8203;</li>
			<li>&#8203;</li>
			<li>&#8203;</li>
		</ul>
	);
};

export default PlaceholderPreview;
