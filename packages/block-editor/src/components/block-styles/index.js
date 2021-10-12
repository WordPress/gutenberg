/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { Button, __experimentalText as Text } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockStylesPreviewPanel from './preview-panel';
import useStylesForBlocks from './use-styles-for-block';

// Block Styles component for the Settings Sidebar.
export default function BlockStyles( {
	clientId,
	onSwitch = noop,
	onHoverClassName = noop,
} ) {
	const {
		onSelect,
		stylesToRender,
		activeStyle,
		genericPreviewBlock,
		className,
	} = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );
	const [ hoveredStyle, setHoveredStyle ] = useState( null );
	const debouncedSetHoveredStyle = useDebounce( setHoveredStyle, 250 );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	const onSelectStylePreview = ( style ) => {
		onSelect( style );
		onHoverClassName( null );
		setHoveredStyle( null );
	};

	const styleItemHandler = ( item ) => {
		if ( hoveredStyle === item ) {
			return;
		}
		debouncedSetHoveredStyle( item );
		onHoverClassName( item?.name ?? null );
	};

	return (
		<div className="block-editor-block-styles">
			<div className="block-editor-block-styles__variants">
				{ stylesToRender.map( ( style ) => {
					const buttonText = style.label || style.name;

					return (
						<Button
							className={ classnames(
								'block-editor-block-styles__item',
								{
									'is-active':
										activeStyle.name === style.name,
								}
							) }
							key={ style.name }
							variant="secondary"
							label={ buttonText }
							onMouseEnter={ () => styleItemHandler( style ) }
							onFocus={ () => styleItemHandler( style ) }
							onMouseLeave={ () => styleItemHandler( null ) }
							onBlur={ () => styleItemHandler( null ) }
							onKeyDown={ ( event ) => {
								if (
									ENTER === event.keyCode ||
									SPACE === event.keyCode
								) {
									event.preventDefault();
									onSelectStylePreview( style );
								}
							} }
							onClick={ () => onSelectStylePreview( style ) }
							role="button"
							tabIndex="0"
						>
							<Text
								as="span"
								limit={ 12 }
								ellipsizeMode="tail"
								truncate
							>
								{ buttonText }
							</Text>
						</Button>
					);
				} ) }
			</div>
			{ hoveredStyle && (
				<BlockStylesPreviewPanel
					activeStyle={ activeStyle }
					className={ className }
					genericPreviewBlock={ genericPreviewBlock }
					style={ hoveredStyle }
				/>
			) }
		</div>
	);
}
