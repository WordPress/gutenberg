/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HtmlRenderer from '../../../utils/html-renderer';

export default function IconGrid( { icons, onChange, attributes } ) {
	return (
		<div className="wp-block-icon__inserter-grid">
			{ icons.length === 0 ? (
				<div className="wp-block-icon__inserter-grid-no-results">
					<p>{ __( 'No results found.' ) }</p>
				</div>
			) : (
				<div
					className="wp-block-icon__inserter-grid-icons-list"
					aria-label={ __( 'Icon library' ) }
				>
					{ icons.map( ( icon ) => {
						return (
							<Button
								key={ icon.name }
								className="wp-block-icon__inserter-grid-icons-list-item"
								onClick={ () => onChange( icon.name ) }
								variant={
									icon.name === attributes?.icon
										? 'primary'
										: undefined
								}
								__next40pxDefaultSize
							>
								<span className="wp-block-icon__inserter-grid-icons-list-item-icon">
									<HtmlRenderer
										html={ icon.content }
										wrapperProps={ {
											style: { width: '24px' },
										} }
									/>
								</span>
								<span className="wp-block-icon__inserter-grid-icons-list-item-title">
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
