function createAuthStore() {
	let _jwt = $state(localStorage.getItem('jwt') || '');
	let _isAuthenticated = $state(localStorage.getItem('isAuthenticated') === 'true');

	return {
		setJwt(jwt: string) {
			_jwt = jwt;
			_isAuthenticated = true;
			localStorage.setItem('jwt', jwt);
			localStorage.setItem('isAuthenticated', 'true');
		},

		setIsAuthenticated(val: boolean) {
			_isAuthenticated = val;
			localStorage.setItem('isAuthenticated', val.toString());
			if (!val) {
				localStorage.removeItem('jwt'); // Clear JWT when logged out
			}
		},

		getIsAuthenticated() {
			return _isAuthenticated;
		},

		getJwt() {
			return _jwt;
		}
	};
}

export const authStore = createAuthStore();
