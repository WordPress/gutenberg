/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, blockDefault } from '@wordpress/icons';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HtmlRenderer from '../../../utils/html-renderer';

export default function IconGrid( props ) {
	const { shownIcons, updateIconAtts, attributes } = props;

	const noResults = (
		<div className="block-editor-inserter__no-results">
			<Icon
				icon={ blockDefault }
				className="block-editor-inserter__no-results-icon"
			/>
			<p>{ __( 'No results found.' ) }</p>
		</div>
	);

	const searchResults = (
		<div className="icons-list">
			{ shownIcons.map( ( icon ) => {
				return (
					<Button
						key={ `icon-${ icon.name }` }
						className={ clsx(
							'icons-list__item',
							'block-editor-block-types-list__item',
							{
								'is-active': icon.name === attributes?.icon,
								'has-no-icon-fill': icon?.hasNoIconFill,
							}
						) }
						onClick={ () => updateIconAtts( icon.name ) }
						__next40pxDefaultSize
					>
						<span className="icons-list__item-icon">
							<HtmlRenderer
								html={ icon.content }
								wrapperProps={ {
									style: { width: `24px` },
								} }
							/>
						</span>
						<span className="icons-list__item-title">
							{ icon.label }
						</span>
					</Button>
				);
			} ) }
		</div>
	);

	return (
		<div className="icon-inserter__content-grid">
			{ shownIcons.length === 0 ? noResults : searchResults }
		</div>
	);
}
