/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { default as InlineColorUI, getActiveColor } from './inline';

const name = 'core/text-color';
const title = __( 'Text Color' );

const EMPTY_ARRAY = [];

function TextColorEdit( { value, onChange, isActive, activeAttributes } ) {
	const colors = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		if ( getSettings ) {
			return get( getSettings(), [ 'colors' ], EMPTY_ARRAY );
		}
		return EMPTY_ARRAY;
	} );
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
	return (
		<>
			<RichTextToolbarButton
				key={ isActive ? 'text-color' : 'text-color-not-active' }
				className="format-library-text-color-button"
				name={ isActive ? 'text-color' : undefined }
				icon={
					<>
						<Dashicon icon="editor-textcolor" />
						{ isActive && (
							<span
								className="format-library-text-color-button__indicator"
								style={ colorIndicatorStyle }
							/>
						) }
					</>
				}
				title={ title }
				onClick={ enableIsAddingColor }
			/>
			{ isAddingColor && (
				<InlineColorUI
					name={ name }
					addingColor={ isAddingColor }
					onClose={ disableIsAddingColor }
					isActive={ isActive }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
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
