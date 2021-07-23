/**
 * WordPress dependencies
 */
import { SearchControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TemplatePartPreviews from './template-part-previews';

export default function TemplatePartSelection( {
	setAttributes,
	onClose,
	area,
	templatePartId = null,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	return (
		<div>
			<SearchControl
				value={ filterValue }
				onChange={ setFilterValue }
				className="wp-block-template-part__selection-preview-search-form"
			/>
			<div className="wp-block-template-part__selection-preview-container">
				<TemplatePartPreviews
					setAttributes={ setAttributes }
					filterValue={ filterValue }
					onClose={ onClose }
					area={ area }
					templatePartId={ templatePartId }
				/>
			</div>
		</div>
	);
}
