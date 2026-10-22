import type { Radio } from '../primitives';
import type { ControlProps } from '../types';

export type CardRadioProps = React.ComponentProps< typeof Radio > &
	Pick< ControlProps, 'label' | 'description' > & {
		/**
		 * Additional content to show in the card, below the label and
		 * description.
		 *
		 * Clicking anywhere on the card selects the radio, so do not include
		 * interactive elements such as links or buttons. This content is not
		 * part of the radio's accessible name or description.
		 */
		children?: React.ReactNode;
	};
