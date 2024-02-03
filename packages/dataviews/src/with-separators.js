/**
 * WordPress dependencies
 */
import { Children, Fragment } from '@wordpress/element';

export default function WithSeparators( {
	children,
	separator = <hr className="dataviews-default-separator" />,
} ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && separator }
				{ child }
			</Fragment>
		) );
}
