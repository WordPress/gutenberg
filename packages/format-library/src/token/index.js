/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { applyFormat, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { plugins as pluginsIcon } from '@wordpress/icons';
import { Popover, SearchControl } from '@wordpress/components';

const name = 'core/token';
const title = __( 'token' );

function Edit( { isActive, value, onChange, onFocus, contentRef } ) {
	const [ addingToken, setAddingToken ] = useState( false );

	function addToken() {
		setAddingToken( true );
	}

	function stopAddingToken( returnFocus = true ) {
		setAddingToken( false );
		if ( returnFocus ) {
			onFocus();
		}
	}

	function onRemoveFormat() {
		addToken();
	}

	// Popover elements.
	let popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: token,
	} );

	const [ searchInput, setSearchInput ] = useState( '' );
	// Simulate fetching the REST API.
	const metadata = [
		{
			name: 'Site title',
			key: 'site_title',
			value: 'This is the title of my site',
		},
		{
			name: 'My custom field 1',
			key: 'custom_field_1',
			value: 'Value of my custom field 1',
		},
		{
			name: 'My custom field 2',
			key: 'custom_field_2',
			value: 'Value of my custom field 2',
		},
		{
			name: 'Post title',
			key: 'post_title',
			value: 'This is the post title',
		},
		{
			name: 'Post summary',
			key: 'post_summary',
			value: 'This is the post summary',
		},
	];
	const [ selectedField, setSelectedField ] = useState( null );

	function selectItem( item ) {
		setSelectedField( item );
		// Check if we can edit the innerContent instead of attributes and
		// use a custom element `data-wp-token` instead of `input`.
		onChange(
			applyFormat( value, {
				type: name,
				attributes: {
					value: item.value,
					bindings: item.key,
				},
			} )
		);
		stopAddingToken();
	}

	return (
		<>
			{ /* When a Token has already been made */ }
			{ isActive && (
				<RichTextToolbarButton
					name="token"
					icon={ pluginsIcon }
					title={ __( 'Edit Token' ) }
					onClick={ onRemoveFormat }
					isActive={ isActive }
					aria-haspopup="true"
					aria-expanded={ addingToken || isActive }
				/>
			) }
			{ /* When there is no Token */ }
			{ ! isActive && (
				<RichTextToolbarButton
					name="token"
					icon={ pluginsIcon }
					title={ title }
					onClick={ addToken }
					isActive={ isActive }
					aria-haspopup="true"
					aria-expanded={ addingToken || isActive }
				/>
			) }
			{ /* When adding a Token show the dropdown */ }
			{ addingToken && (
				<Popover
					anchor={ popoverAnchor }
					onClose={ stopAddingToken }
					onFocusOutside={ () => stopAddingToken( false ) }
					placement="bottom"
					shift
				>
					<SearchControl
						label={ __( 'Search metadata' ) }
						value={ searchInput }
						onChange={ setSearchInput }
						size="compact"
					/>
					<ul className="token-metadata-list">
						{ metadata.map( ( item ) => (
							<li
								key={ item.key }
								onClick={ () => selectItem( item ) }
								className={
									selectedField?.key === item.key
										? 'selected-meta-field'
										: ''
								}
							>
								{ item.name }
							</li>
						) ) }
					</ul>
				</Popover>
			) }
		</>
	);
}

export const token = {
	name,
	title,
	tagName: 'input',
	className: 'inline-token',
	attributes: {
		id: 'data-id',
		_id: 'id',
		value: '',
		bindings: 'data-wp-bindings',
	},
	edit: Edit,
};
