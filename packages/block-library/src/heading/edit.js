/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import HeadingToolbar from './heading-toolbar';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalText,
	RangeControl as Text,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { Platform } from '@wordpress/element';
import {
	GlobalStylesControls,
	GlobalStylesPanelBody,
	useGlobalStylesState,
} from '@wordpress/global-styles';

function HeadingEdit( { attributes, setAttributes, mergeBlocks, onReplace } ) {
	const { headingFontWeight, setStyles } = useGlobalStylesState();
	const { align, content, level, placeholder, style } = attributes;
	const tagName = 'h' + level;
	const isAndroid = Platform.select( {
		android: true,
		native: false,
		web: false,
	} );

	const styles = {
		color: style && style.color && style.color.text,
	};

	return (
		<>
			<BlockControls>
				<HeadingToolbar
					minLevel={ Platform.OS === 'web' ? 2 : 1 }
					maxLevel={ Platform.OS === 'web' ? 5 : 7 }
					selectedLevel={ level }
					onChange={ ( newLevel ) =>
						setAttributes( { level: newLevel } )
					}
				/>
				{ ! isAndroid && (
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				) }
			</BlockControls>
			{ Platform.OS === 'web' && (
				<>
					<GlobalStylesControls>
						<GlobalStylesPanelBody title={ __( 'Heading' ) }>
							<Text
								label={ __( 'Font Weight' ) }
								value={ headingFontWeight }
								onChange={ ( nextValue ) =>
									setStyles( {
										headingFontWeight: nextValue,
									} )
								}
								min={ 100 }
								max={ 900 }
								step={ 100 }
							/>
						</GlobalStylesPanelBody>
					</GlobalStylesControls>
					<InspectorControls>
						<PanelBody title={ __( 'Heading settings' ) }>
							<Text variant="label">{ __( 'Level' ) }</Text>
							<HeadingToolbar
								isCollapsed={ false }
								minLevel={ 1 }
								maxLevel={ 7 }
								selectedLevel={ level }
								onChange={ ( newLevel ) =>
									setAttributes( { level: newLevel } )
								}
							/>
						</PanelBody>
					</InspectorControls>
				</>
			) }
			<RichText
				identifier="content"
				tagName={ Block[ tagName ] }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				onMerge={ mergeBlocks }
				onSplit={ ( value ) => {
					if ( ! value ) {
						return createBlock( 'core/paragraph' );
					}

					return createBlock( 'core/heading', {
						...attributes,
						content: value,
					} );
				} }
				onReplace={ onReplace }
				onRemove={ () => onReplace( [] ) }
				className={ classnames( {
					[ `has-text-align-${ align }` ]: align,
				} ) }
				placeholder={ placeholder || __( 'Write heading…' ) }
				textAlign={ align }
				style={ styles }
			/>
		</>
	);
}

export default HeadingEdit;
