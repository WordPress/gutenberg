/**
 * WordPress dependencies
 */
import { Dropdown } from '@wordpress/components';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import StylesPreview from './preview';
import Variations from './variations';

function GlobalStylesVariationSelector() {
	return (
		<Dropdown
			className="edit-site-global-styles-variation-selector"
			contentClassName="edit-site-global-styles-variation-selector__popover"
			position="bottom middle"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnEnter = ( event ) => {
					if ( ! isOpen && event.keyCode === ENTER ) {
						event.preventDefault();
						onToggle();
					}
				};

				return (
					<StylesPreview
						role="button"
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onKeyDown={ openOnEnter }
					/>
				);
			} }
			renderContent={ () => {
				return <Variations />;
			} }
		/>
	);
}

export default GlobalStylesVariationSelector;
