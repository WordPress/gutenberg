/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Header from './header';

export default function Page( {
	title,
	subTitle,
	actions,
	children,
	className,
} ) {
	const classes = classnames( 'edit-site-page', className );

	return (
		<div className={ classes }>
			{ title && (
				<Header
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
				/>
			) }
			<div className="edit-site-page-content">{ children }</div>
		</div>
	);
}
