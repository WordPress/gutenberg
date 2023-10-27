/**
 * WordPress dependencies
 */
import { Button, Icon, ToggleControl, PanelBody } from '@wordpress/components';
import { close } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function Edit( { attributes, isSelected, setAttributes } ) {
	const blockProps = useBlockProps();
	const history = useHistory();
	const { hasIcon } = attributes;

	const closeText = __( 'Close' );

	const onClick = () => {
		if ( isSelected ) {
			// Exit navigation overlay edit mode.
			history.back();
		}
	};

	blockProps.onClick = onClick;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Display' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Use icon' ) }
						help={ __(
							'Configure whether the button use an icon or text.'
						) }
						onChange={ ( value ) =>
							setAttributes( { hasIcon: value } )
						}
						checked={ hasIcon }
					/>
				</PanelBody>
			</InspectorControls>
			<Button { ...blockProps } aria-label={ hasIcon && closeText }>
				{ hasIcon ? <Icon icon={ close } /> : closeText }
			</Button>
		</>
	);
}
