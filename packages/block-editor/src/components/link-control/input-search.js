
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { URLInput } from '../';

const LinkControlInputSearch = ( {
	value,
	onChange,
	onSelect,
	renderSuggestions,
	fetchSuggestions,
	onReset,
	onKeyDown,
	onKeyPress,
} ) => {
	const selectItemHandler = ( value, suggestion ) => {
		onChange( value );

		if ( suggestion ) {
			onSelect( suggestion );
		}
	};

	const stopFormEventsPropagation = event => {
		event.preventDefault();
		event.stopPropagation();
	};

	return (
		<form
			onSubmit={ stopFormEventsPropagation }
			onKeyDown={ ( event ) => {
				if ( event.keyCode === ENTER ) {
					return;
				}
				onKeyDown( event );
			} }
			onKeyPress={ onKeyPress }
		>
			<URLInput
				className="block-editor-link-control__search-input"
				value={ value }
				onChange={ selectItemHandler }
				placeholder={ __( 'Search or type url' ) }
				__experimentalRenderSuggestions={ renderSuggestions }
				__experimentalFetchLinkSuggestions={ fetchSuggestions }
				__experimentalHandleURLSuggestions={ true }
			/>

			<IconButton
				disabled={ ! value.length }
				type="reset"
				label={ __( 'Reset' ) }
				icon="no-alt"
				className="block-editor-link-control__search-reset"
				onClick={ onReset }
			/>

		</form>
	);
};

export default LinkControlInputSearch;
