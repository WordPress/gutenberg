/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HtmlRenderer from '../../../utils/html-renderer';

export default function IconGrid( props ) {
	const { shownIcons, updateIconAtts, attributes } = props;

	return (
		<div className="wp-block-icon__inserter-content-grid">
			{ shownIcons.length === 0 ? (
				<div className="wp-block-icon__inserter-content-grid-no-results">
					<p>{ __( 'No results found.' ) }</p>
				</div>
			) : (
				<div className="wp-block-icon__inserter-content-grid-icons-list">
					{ shownIcons.map( ( icon ) => {
						return (
							<Button
								key={ `icon-${ icon.name }` }
								className={ clsx(
									'wp-block-icon__inserter-content-grid-icons-list-item',
									'block-editor-block-types-list__item',
									{
										'is-active':
											icon.name === attributes?.icon,
									}
								) }
								onClick={ () => updateIconAtts( icon.name ) }
								__next40pxDefaultSize
							>
								<span className="wp-block-icon__inserter-content-grid-icons-list-item-icon">
									<HtmlRenderer
										html={ icon.content }
										wrapperProps={ {
											style: { width: `24px` },
										} }
									/>
								</span>
								<span className="wp-block-icon__inserter-content-grid-icons-list-item-title">
									{ icon.label }
								</span>
							</Button>
						);
					} ) }
				</div>
			) }
		</div>
	);
}
