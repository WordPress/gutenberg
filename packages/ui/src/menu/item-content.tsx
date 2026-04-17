import type { ReactNode } from 'react';
import styles from './styles.module.css';
import { ItemHelpText } from './item-help-text';
import { ItemLabel } from './item-label';

interface ItemContentProps {
	children: ReactNode;
	helpText?: ReactNode;
	suffix?: ReactNode;
}

const renderLabel = ( children: ReactNode ) => {
	if ( typeof children === 'string' || typeof children === 'number' ) {
		return <ItemLabel>{ children }</ItemLabel>;
	}

	return children;
};

function ItemContent( { children, helpText, suffix }: ItemContentProps ) {
	return (
		<div className={ styles.content }>
			<div className={ styles.label }>
				{ renderLabel( children ) }
				{ helpText && <ItemHelpText>{ helpText }</ItemHelpText> }
			</div>
			{ suffix && <span className={ styles.suffix }>{ suffix }</span> }
		</div>
	);
}

export { ItemContent };
