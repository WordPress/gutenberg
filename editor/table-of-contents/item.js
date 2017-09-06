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
			'table-of-contents-item',
			`is-h${ level }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<button
			className="table-of-contents__button"
			onClick={ onClick }
			aria-label={ __( 'Focus heading block' ) }
		>
			<span className="table-of-contents-item__emdash" aria-hidden="true"></span>
			<strong className="table-of-contents-item__level">
				H{ level }
			</strong>
			<span className="table-of-contents-item__content">
				{ children }
			</span>
		</button>
	</li>
);

export default TableOfContentsItem;
