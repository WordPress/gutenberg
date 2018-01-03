/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const TableOfContentsItem = ( {
	children,
	isValid,
	level,
	onClick,
} ) => (
	<li
		className={ classnames(
			'document-outline__item',
			`is-${ level.toLowerCase() }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<button
			className="document-outline__button"
			onClick={ onClick }
		>
			<span className="document-outline__emdash" aria-hidden="true"></span>
			<strong className="document-outline__level">
				{ level }
			</strong>
			<span className="document-outline__item-content">
				{ children }
			</span>
			<span className="screen-reader-text">{ __( '(Click to focus this heading)' ) }</span>
		</button>
	</li>
);

export default TableOfContentsItem;
