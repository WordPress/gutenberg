import styles from './style.module.css';

export function ToolIcon( { logo }: { logo?: string } ) {
	if ( ! logo ) {
		return (
			<span className={ styles.mark } aria-hidden="true">
				{ '{}' }
			</span>
		);
	}
	return (
		<img
			className={ styles.logo }
			src={ logo }
			alt=""
			width={ 32 }
			height={ 32 }
		/>
	);
}
