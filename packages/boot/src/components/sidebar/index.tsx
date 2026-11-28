import { useSelect } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	ButtonLink,
} from '@wordpress/ui';
import Navigation from '../navigation';
import SaveButton from '../save-button';
import { store as bootStore } from '../../store';
import styles from './style.module.scss';

function DashboardBackButton() {
	const dashboardLink = useSelect(
		( select ) => select( bootStore ).getDashboardLink(),
		[]
	);
	return (
		<ButtonLink
			variant="minimal"
			tone="neutral"
			className={ styles[ 'back-button' ] }
			href={ dashboardLink || '/' }
			aria-label={ __( 'Go to the Dashboard' ) }
		>
			<ButtonLink.Icon icon={ isRTL() ? chevronRight : chevronLeft } />
			{ __( 'Dashboard' ) }
		</ButtonLink>
	);
}

export default function Sidebar() {
	return (
		<div className={ styles.scrollable }>
			<DashboardBackButton />
			<div className={ styles.content }>
				<Navigation />
			</div>
			<div className={ styles.footer }>
				<SaveButton />
			</div>
		</div>
	);
}
