/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insertObject, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';
import { Popover, TextControl } from '@wordpress/components';

const name = 'core/footnote';
const title = __( 'Footnote' );

export const footnote = {
	name,
	title,
	tagName: 'data',
	className: null,
	edit( {
		isObjectActive,
		value,
		onChange,
		onFocus,
		contentRef,
		activeObjectAttributes,
	} ) {
		function onClick() {
			const newValue = insertObject( value, {
				type: name,
				attributes: {
					innerHtml: '',
				},
				tagName: 'data',
			} );
			newValue.start = newValue.end - 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<>
				<RichTextToolbarButton
					icon={ formatListNumbered }
					title={ title }
					onClick={ onClick }
					isActive={ isObjectActive }
				/>
				{ isObjectActive && (
					<InlineUI
						value={ value }
						onChange={ onChange }
						activeObjectAttributes={ activeObjectAttributes }
						contentRef={ contentRef }
					/>
				) }
			</>
		);
	},
};

function InlineUI( { value, onChange, activeObjectAttributes, contentRef } ) {
	const { innerHtml } = activeObjectAttributes;
	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: footnote,
	} );

	const note = innerHtml.replace( /^\[/, '' ).replace( /\]$/, '' );

	return (
		<Popover
			placement="bottom"
			focusOnMount={ true }
			anchor={ popoverAnchor }
			className="block-editor-format-toolbar__image-popover"
		>
			<TextControl
				className="block-editor-format-toolbar__image-container-value"
				label={ __( 'Note' ) }
				value={ note }
				onChange={ ( newNote ) => {
					const newReplacements = value.replacements.slice();

					newReplacements[ value.start ] = {
						tagName: 'data',
						type: name,
						attributes: {
							...activeObjectAttributes,
							innerHtml: '[' + newNote + ']',
						},
					};

					onChange( {
						...value,
						replacements: newReplacements,
					} );
				} }
			/>
		</Popover>
	);
}
