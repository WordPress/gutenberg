declare namespace jest {
	interface Matchers< R > {
		toHaveErrored(): R;
		toHaveErroredWith( ...data: any[] ): R;
		toHaveInformed(): R;
		toHaveInformedWith( ...data: any[] ): R;
		toHaveLogged(): R;
		toHaveLoggedWith( ...data: any[] ): R;
		toHaveWarned(): R;
		toHaveWarnedWith( ...data: any[] ): R;
	}
}
