import { useMemo, useState } from '@wordpress/element';
import {
	transformStyles,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { SandBox } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { unlock } from '../lock-unlock';

const { InterceptedLinkPopover } = unlock( blockEditorPrivateApis );

// Default styles used to unset some of the styles
// that might be inherited from the editor style.
const DEFAULT_STYLES = `
	html,body,:root {
		margin: 0 !important;
		padding: 0 !important;
		overflow: visible !important;
		min-height: auto !important;
	}
`;

export default function HTMLEditPreview( { content, isSelected } ) {
	// The link whose click inside the sandbox was intercepted, if any,
	// anchoring the popover that offers to open it in a new tab.
	const [ interceptedLink, setInterceptedLink ] = useState();
	const settingStyles = useSelect(
		( select ) => select( blockEditorStore ).getSettings().styles,
		[]
	);

	const styles = useMemo(
		() => [
			DEFAULT_STYLES,
			...transformStyles(
				( settingStyles ?? [] ).filter( ( style ) => style.css )
			),
		],
		[ settingStyles ]
	);

	return (
		<>
			<SandBox
				html={ content }
				styles={ styles }
				title={ __( 'Custom HTML Preview' ) }
				tabIndex={ -1 }
				onLinkClick={ setInterceptedLink }
			/>
			{ interceptedLink && (
				<InterceptedLinkPopover
					href={ interceptedLink.href }
					anchor={ interceptedLink.anchor }
					onClose={ () => setInterceptedLink( undefined ) }
				/>
			) }
			{ /*
				An overlay is added when the block is not selected in order to register click events.
				Some browsers do not bubble up the clicks from the sandboxed iframe, which makes it
				difficult to reselect the block.
			*/ }
			{ ! isSelected && (
				<div className="block-library-html__preview-overlay"></div>
			) }
		</>
	);
}
