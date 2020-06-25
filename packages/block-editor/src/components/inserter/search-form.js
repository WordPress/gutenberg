/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden, Button } from '@wordpress/components';
import { Icon, search, closeSmall } from '@wordpress/icons';
import { useRef } from '@wordpress/element';

function InserterSearchForm( { onChange, value } ) {
	const instanceId = useInstanceId( InserterSearchForm );
	const searchInput = useRef();

	// Disable reason (no-autofocus): The inserter menu is a modal display, not one which
	// is always visible, and one which already incurs this behavior of autoFocus via
	// Popover's focusOnMount.
	/* eslint-disable jsx-a11y/no-autofocus */
	return (
		<div className="block-editor-inserter__search">
			<VisuallyHidden
				as="label"
				htmlFor={ `block-editor-inserter__search-${ instanceId }` }
			>
				{ __( 'Search for a block' ) }
			</VisuallyHidden>
			<input
				ref={ searchInput }
				className="block-editor-inserter__search-input"
				id={ `block-editor-inserter__search-${ instanceId }` }
				type="search"
				placeholder={ __( 'Search for a block' ) }
				autoFocus
				onChange={ ( event ) => onChange( event.target.value ) }
				autoComplete="off"
				value={ value || '' }
			/>
			<div className="block-editor-inserter__search-icon">
				{ !! value && (
					<Button
						icon={ closeSmall }
						label={ __( 'Reset search' ) }
						onClick={ () => {
							onChange( '' );
							searchInput.current.focus();
						} }
					/>
				) }
				{ ! value && <Icon icon={ search } /> }
			</div>
		</div>
	);
	/* eslint-enable jsx-a11y/no-autofocus */
}

export default InserterSearchForm;
