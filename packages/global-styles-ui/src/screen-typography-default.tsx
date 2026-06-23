/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalSpacer as Spacer, Button } from '@wordpress/components';
import { useState, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import { ScreenHeader } from './screen-header';
import TypographyPreview from './typography-preview';
import { GlobalStylesContext } from './context';
import ConfirmApplyFontToAllDialog from './confirm-apply-font-to-all-dialog';
import { useStyle } from './hooks';
import { applyFontFamilyToAllElements, TYPOGRAPHY_ELEMENTS } from './utils';

function ScreenTypographyDefault() {
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );
	const { user, onChange } = useContext( GlobalStylesContext );

	// Get root font family (using empty prefix for root)
	const [ rootFontFamily ] = useStyle< string >( 'typography.fontFamily' );

	// Handler for apply to all
	const handleApplyToAll = () => {
		if ( ! rootFontFamily ) {
			return;
		}

		const updatedConfig = applyFontFamilyToAllElements(
			user,
			rootFontFamily
		);
		onChange( updatedConfig );
	};

	// Get font name for display (extract from var:preset or use raw value)
	const getFontDisplayName = ( fontFamily: string ) => {
		if ( fontFamily?.startsWith( 'var:preset|font-family|' ) ) {
			return fontFamily
				.replace( 'var:preset|font-family|', '' )
				.replace( /-/g, ' ' );
		}
		return fontFamily || '';
	};

	return (
		<>
			<ScreenHeader
				title={ __( 'Default' ) }
				description={ __(
					'Set the default font that will be applied to all typography elements on the site.'
				) }
			/>
			<Spacer marginX={ 4 }>
				<TypographyPreview element="text" headingLevel="heading" />
			</Spacer>
			<TypographyPanel element="default" headingLevel="heading" />

			<Spacer marginX={ 4 } marginBottom={ 4 }>
				<Button
					variant="primary"
					onClick={ () => setIsDialogOpen( true ) }
					disabled={ ! rootFontFamily }
					accessibleWhenDisabled
					__next40pxDefaultSize
				>
					{ __( 'Apply to all elements' ) }
				</Button>
			</Spacer>

			<ConfirmApplyFontToAllDialog
				fontName={ getFontDisplayName( rootFontFamily ) }
				elementCount={ TYPOGRAPHY_ELEMENTS.length }
				isOpen={ isDialogOpen }
				toggleOpen={ () => setIsDialogOpen( ! isDialogOpen ) }
				onConfirm={ handleApplyToAll }
			/>
		</>
	);
}

export default ScreenTypographyDefault;
