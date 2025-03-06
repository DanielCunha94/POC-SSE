<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { api } from '$lib/utils/http';
	import { fetchEventSource } from '@microsoft/fetch-event-source';
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let events = $state<any>([]);

	onMount(() => {
		if (!authStore.getIsAuthenticated()) {
			return;
		}
		fetchEventSource('http://localhost:8080/sse', {
			openWhenHidden:true,
			headers: {
				Authorization: `bearer ${authStore.getJwt()}`
			},
			onmessage(msg) {
				console.log(msg);
				if (msg.data) {
					const data = JSON.parse(msg.data);
					events.push({ type: msg.event, data, id: msg.id });
					console.log(data);
				}
			},
			onerror(err) {
				console.log(err);
			}
		});
	});

	async function handleNewRent() {
		const res = await api.post('/rent', undefined, {
			Authorization: `bearer ${authStore.getJwt()}`
		});
		console.log(res.hasError);
	}

	async function handleNewBloq() {
		const res = await api.post('/bloq', undefined, {
			Authorization: `bearer ${authStore.getJwt()}`
		});
		console.log(res.hasError);
	}
</script>

<div class="mt-4 flex justify-center gap-4">
	<Button
		onclick={(e) => {
			e.preventDefault();
			handleNewRent();
		}}
		type="submit"
	>
		new rent
	</Button>

	<Button
		onclick={(e) => {
			e.preventDefault();
			handleNewBloq();
		}}
		type="submit"
	>
		new bloq
	</Button>
</div>
<ul>
	{#each events as event, i}
		<li>
			<Badge>{event.type}</Badge>
			<p>{event.data.message}</p>
		</li>
	{/each}
</ul>
