/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useStylesForBlocks from './use-styles-for-block';

const noop = () => {};

// Block Styles component for the Settings Sidebar.
function BlockStyles( { clientId, onSwitch = noop } ) {
	const { onSelect, stylesToRender, activeStyle } = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );

	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}

	return (
		<div className="block-editor-block-styles">
			<div className="block-editor-block-styles__variants">
				{ stylesToRender.map( ( style ) => {
					const buttonText = style.label || style.name;

					return (
						<Button
							__next40pxDefaultSize
							className={ clsx(
								'block-editor-block-styles__item',
								{
									'is-active':
										activeStyle.name === style.name,
								}
							) }
							key={ style.name }
							variant="secondary"
							label={ buttonText }
							onClick={ () => onSelect( style ) }
							aria-current={ activeStyle.name === style.name }
						>
							<Truncate
								numberOfLines={ 1 }
								className="block-editor-block-styles__item-text"
							>
								{ buttonText }
							</Truncate>
						</Button>
					);
				} ) }
			</div>
		</div>
	);
}

export default BlockStyles;
