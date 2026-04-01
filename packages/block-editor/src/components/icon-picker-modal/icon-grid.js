/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { safeHTML } from '@wordpress/dom';

export default function IconGrid( { icons, onSelect, value } ) {
	return (
		<div className="block-editor-icon-picker-modal__grid">
			{ ! icons?.length ? (
				<div className="block-editor-icon-picker-modal__grid-no-results">
					<p>{ __( 'No results found.' ) }</p>
				</div>
			) : (
				<div
					className="block-editor-icon-picker-modal__grid-icons-list"
					aria-label={ __( 'Icon library' ) }
				>
					{ icons.map( ( icon ) => {
						return (
							<Button
								key={ icon.name }
								className="block-editor-icon-picker-modal__grid-icons-list-item"
								onClick={ () => onSelect?.( icon.name ) }
								variant={
									icon.name === value ? 'primary' : undefined
								}
								__next40pxDefaultSize
							>
								<span className="block-editor-icon-picker-modal__grid-icons-list-item-icon">
									<span
										className="block-editor-icon-picker-modal__grid-icons-list-item-svg"
										dangerouslySetInnerHTML={ {
											__html: safeHTML( icon.content ),
										} }
									/>
								</span>
								<span className="block-editor-icon-picker-modal__grid-icons-list-item-title">
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
