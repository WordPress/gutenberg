/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { CloseButton } from '../close-button';
import * as styles from './styles';

const { RemoveButtonView } = styles;

type Props = {
	onClick?: () => void;
	removeButtonText?: string;
};

function TagRemoveButton( { onClick = noop, removeButtonText }: Props ) {
	if ( ! removeButtonText ) return null;

	return (
		<RemoveButtonView>
			<CloseButton
				aria-label={ removeButtonText }
				currentColor
				iconSize={ 12 }
				onClick={ onClick }
				size="xSmall"
				title={ removeButtonText }
				variant="tertiary"
			/>
		</RemoveButtonView>
	);
}

export default React.memo( TagRemoveButton );
