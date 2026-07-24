/**
 * WordPress dependencies
 */
import { Icon as WCIcon } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';

function getLabelContent(
	showError?: boolean,
	errorMessage?: string,
	fieldLabel?: string
) {
	return showError ? (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<span className="dataforms-layouts-panel__field-label-error-content">
						<WCIcon icon={ errorIcon } size={ 16 } />
						<VisuallyHidden>{ errorMessage }: </VisuallyHidden>
						{ fieldLabel }
					</span>
				}
			/>
			<Tooltip.Popup>{ errorMessage }</Tooltip.Popup>
		</Tooltip.Root>
	) : (
		fieldLabel
	);
}

export default getLabelContent;
