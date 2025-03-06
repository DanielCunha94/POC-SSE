<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import '../app.css';

	let { children } = $props();

	$effect(() => {
		!authStore.getIsAuthenticated() ? goto('/login') : goto('/');
	});
</script>

{@render children()}
