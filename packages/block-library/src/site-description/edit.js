/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useEntityProp,
	__experimentalUseEntitySaving,
} from '@wordpress/core-data';
import { Button, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	AlignmentToolbar,
	BlockControls,
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
	PlainText,
	withColors,
	withFontSizes,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { ENTER } from '@wordpress/keycodes';

function SiteDescriptionEdit( {
	attributes,
	backgroundColor,
	className,
	fontSize,
	insertDefaultBlock,
	setAttributes,
	setBackgroundColor,
	setFontSize,
	setTextColor,
	textColor,

} ) {
	const [ description, setDescription ] = useEntityProp( 'root', 'site', 'description' );
	const [ isDirty, isSaving, save ] = __experimentalUseEntitySaving(
		'root',
		'site',
		'description'
	);

	const { customFontSize, textAlign } = attributes;
	const actualFontSize = customFontSize || fontSize.size;

	const preventNewlines = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			insertDefaultBlock();
		}
	};

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => setAttributes( { textAlign: nextAlign } ) }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody className="blocks-font-size" title={ __( 'Text Settings' ) }>
					<FontSizePicker onChange={ setFontSize } value={ actualFontSize } />
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background Color' ),
						},
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text Color' ),
						},
					] }
				>
					<ContrastChecker
						{ ...{
							textColor: textColor.color,
							backgroundColor: backgroundColor.color,
						} }
						fontSize={ actualFontSize }
					/>
				</PanelColorSettings>
			</InspectorControls>
			<Button
				isPrimary
				className="wp-block-site-description__save-button"
				disabled={ ! isDirty || ! description }
				isBusy={ isSaving }
				onClick={ save }
			>
				{ __( 'Update' ) }
			</Button>
			<PlainText
				className={ classNames( 'site-description', className, {
					'has-text-color': textColor.color,
					'has-background': backgroundColor.color,
					[ `has-text-align-${ textAlign }` ]: textAlign,
					[ backgroundColor.class ]: backgroundColor.class,
					[ textColor.class ]: textColor.class,
					[ fontSize.class ]: ! customFontSize && fontSize.class,
				} ) }
				isStylable
				multiline={ false }
				onChange={ setDescription }
				onKeyDown={ preventNewlines }
				placeholder={ __( 'Site Description' ) }
				style={ {
					backgroundColor: backgroundColor.color,
					color: textColor.color,
					fontSize: actualFontSize ? actualFontSize + 'px' : undefined,
				} }
				value={ description }
			/>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withFontSizes( 'fontSize' ),
	withSelect( ( select, { clientId } ) => {
		const { getBlockIndex, getBlockRootClientId } = select( 'core/block-editor' );
		const rootClientId = getBlockRootClientId( clientId );
		return {
			blockIndex: getBlockIndex( clientId, rootClientId ),
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, { blockIndex, rootClientId } ) => ( {
		insertDefaultBlock: () =>
			dispatch( 'core/block-editor' ).insertDefaultBlock( undefined, rootClientId, blockIndex + 1 ),
	} ) ),
] )( SiteDescriptionEdit );
