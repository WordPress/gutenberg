import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

export default function Edit( props ) {
	const { attributes, setAttributes } = props;
	const { linkTarget, showModerationLinks } = attributes;
	useDeprecatedTextAlign( props );
	const blockProps = useBlockProps();

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						linkTarget: '_self',
						showModerationLinks: false,
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Open in new tab' ) }
					isShownByDefault
					hasValue={ () => linkTarget === '_blank' }
					onDeselect={ () =>
						setAttributes( { linkTarget: '_self' } )
					}
				>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						onChange={ ( value ) =>
							setAttributes( {
								linkTarget: value ? '_blank' : '_self',
							} )
						}
						checked={ linkTarget === '_blank' }
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Show moderation links' ) }
					isShownByDefault
					hasValue={ () => !! showModerationLinks }
					onDeselect={ () =>
						setAttributes( { showModerationLinks: false } )
					}
				>
					<ToggleControl
						label={ __( 'Show moderation links' ) }
						help={ __(
							'Also display links to unapprove, spam, or trash the comment.'
						) }
						onChange={ ( value ) =>
							setAttributes( { showModerationLinks: value } )
						}
						checked={ !! showModerationLinks }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	return (
		<>
			{ inspectorControls }
			<div { ...blockProps }>
				<a
					href="#edit-comment-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ __( 'Edit' ) }
				</a>
				{ showModerationLinks &&
					[
						__( 'Unapprove' ),
						_x( 'Spam', 'verb' ),
						_x( 'Trash', 'verb' ),
					].map( ( label ) => (
						<Fragment key={ label }>
							{ ' ' }
							<a
								href="#moderate-comment-pseudo-link"
								onClick={ ( event ) => event.preventDefault() }
							>
								{ label }
							</a>
						</Fragment>
					) ) }
			</div>
		</>
	);
}
