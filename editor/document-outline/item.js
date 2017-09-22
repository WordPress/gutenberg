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
			`is-h${ level }`,
			{
				'is-invalid': ! isValid,
			}
		) }
	>
		<button
			className="document-outline__button"
			onClick={ onClick }
			title={ `"Heading Content here..." ${ __( '(click to focus this heading block)' ) }` }
		>
			<span className="document-outline__emdash" aria-hidden="true"></span>
			<strong className="document-outline__level">
				H{ level }
			</strong>
			<span className="document-outline__item-content">
				{ children }
			</span>
		</button>
	</li>
);

export default TableOfContentsItem;
