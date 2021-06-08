/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { RichTextToolbarButton, useSetting } from '@wordpress/block-editor';
import { Icon, textColor as textColorIcon } from '@wordpress/icons';
import { removeFormat } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { default as InlineColorUI, getActiveColor } from './inline';

const name = 'core/text-color';
const title = __( 'Text color' );

const EMPTY_ARRAY = [];

function TextColorEdit( {
	value,
	onChange,
	isActive,
	activeAttributes,
	contentRef,
} ) {
	const allowCustomControl = useSetting( 'color.custom' );
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const [ isAddingColor, setIsAddingColor ] = useState( false );
	const enableIsAddingColor = useCallback( () => setIsAddingColor( true ), [
		setIsAddingColor,
	] );
	const disableIsAddingColor = useCallback( () => setIsAddingColor( false ), [
		setIsAddingColor,
	] );
	const colorIndicatorStyle = useMemo( () => {
		const activeColor = getActiveColor( name, value, colors );
		if ( ! activeColor ) {
			return undefined;
		}
		return {
			backgroundColor: activeColor,
		};
	}, [ value, colors ] );

	const hasColorsToChoose = ! isEmpty( colors ) || ! allowCustomControl;
	if ( ! hasColorsToChoose && ! isActive ) {
		return null;
	}

	return (
		<>
			<RichTextToolbarButton
				key={ isActive ? 'text-color' : 'text-color-not-active' }
				className="format-library-text-color-button"
				name={ isActive ? 'text-color' : undefined }
				icon={
					<>
						<Icon icon={ textColorIcon } />
						{ isActive && (
							<span
								className="format-library-text-color-button__indicator"
								style={ colorIndicatorStyle }
							/>
						) }
					</>
				}
				title={ title }
				// If has no colors to choose but a color is active remove the color onClick
				onClick={
					hasColorsToChoose
						? enableIsAddingColor
						: () => onChange( removeFormat( value, name ) )
				}
			/>
			{ isAddingColor && (
				<InlineColorUI
					name={ name }
					onClose={ disableIsAddingColor }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
				/>
			) }
		</>
	);
}

export const textColor = {
	name,
	title,
	tagName: 'span',
	className: 'has-inline-color',
	attributes: {
		style: 'style',
		class: 'class',
	},
	edit: TextColorEdit,
};
