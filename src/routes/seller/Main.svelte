<script lang="ts">
    import BeforeLogin from '../../components/seller/BeforeLogin.svelte';
    import AfterLogin from '../../components/seller/AfterLogin.svelte';

    let sellerId: string;

    $: sellerId = localStorage.getItem('sellerId');
</script>

{#if sellerId}
    <AfterLogin />
{:else}
    <BeforeLogin />
{/if}
