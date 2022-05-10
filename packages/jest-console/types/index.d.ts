declare namespace jest {
	interface Matchers< R > {
		toHaveErrored(): void;
		toHaveErroredWith( ...data: any[] ): void;
		toHaveInformed(): void;
		toHaveInformedWith( ...data: any[] ): void;
		toHaveLogged(): void;
		toHaveLoggedWith( ...data: any[] ): void;
		toHaveWarned(): void;
		toHaveWarnedWith( ...data: any[] ): void;
	}
}
