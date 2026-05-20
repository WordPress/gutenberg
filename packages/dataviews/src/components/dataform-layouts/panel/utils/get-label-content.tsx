/**
 * WordPress dependencies
 */
import { Icon as WCIcon, Tooltip as WCTooltip } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';

function getLabelContent(
	showError?: boolean,
	errorMessage?: string,
	fieldLabel?: string
) {
	return showError ? (
		<WCTooltip text={ errorMessage } placement="top">
			<span className="dataforms-layouts-panel__field-label-error-content">
				<WCIcon icon={ errorIcon } size={ 16 } />
				{ fieldLabel }
			</span>
		</WCTooltip>
	) : (
		fieldLabel
	);
}

export default getLabelContent;
