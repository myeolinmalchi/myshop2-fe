<script lang="ts">
    import CheckProfile from '../../components/user/CheckProfile.svelte';
    import Profile from '../../components/user/Profile.svelte';
    import Orders from '../../components/user/Orders.svelte';

    let state: string = 'orders';
    let checked: boolean = false;
    let userPw: string;
</script>

{#if state === 'orders'}
    <Orders bind:state } />
{:else if state === 'profile' && !checked}
    <CheckProfile bind:checked bind:userPw />
{:else if state === 'profile' && checked}
    <Profile bind:state bind:userPw />
{/if}

<style global>
</style>
