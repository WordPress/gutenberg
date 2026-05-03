/**
 * WordPress dependencies
 */
import { Icon, Tooltip } from '@wordpress/components';
import { error as errorIcon } from '@wordpress/icons';

function getLabelContent(
	showError?: boolean,
	errorMessage?: string,
	fieldLabel?: string
) {
	return showError ? (
		<Tooltip text={ errorMessage } placement="top">
			<span className="dataforms-layouts-panel__field-label-error-content">
				<Icon icon={ errorIcon } size={ 16 } />
				{ fieldLabel }
			</span>
		</Tooltip>
	) : (
		fieldLabel
	);
}

export default getLabelContent;
