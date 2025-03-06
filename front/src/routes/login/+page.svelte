<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { api } from '$lib/utils/http';

	let username = $state('');
	let password = $state('');

	async function handleLogin() {
		console.log(username);
		console.log(password);
		const res = await api.post<unknown, { token: string }>('/login', {
			email: username,
			password
		});
		console.log(res.data);
		if (res?.data?.token) {
			authStore.setJwt(res?.data.token);
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<form>
		<Card.Root class="w-[350px]">
			<Card.Content>
				<Label for="Username">Username</Label>
				<Input id="Username" name="username" placeholder="Username" bind:value={username} />
				<Label for="passoword">Password</Label>
				<Input
					id="passoword"
					type="password"
					name="password"
					placeholder="Password"
					bind:value={password}
				/>
			</Card.Content>
			<Card.Footer class="flex justify-end">
				<Button
					onclick={(e) => {
						e.preventDefault();
						handleLogin();
					}}
					type="submit">login</Button
				>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
