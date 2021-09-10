<script>
    import { maxDate } from '$lib/stores';
    import dayjs from 'dayjs';
</script>

<div>
    <button on:click={() => ($maxDate = dayjs($maxDate).subtract(1, 'month').toDate())}
        >-1 Monat</button
    >
    <button on:click={() => ($maxDate = dayjs($maxDate).subtract(1, 'week').toDate())}>-1 Woche</button
    >
    <button on:click={() => ($maxDate = dayjs($maxDate).subtract(1, 'day').toDate())}>-1 Tag</button
    >
    <button on:click={() => ($maxDate = new Date())}>heute</button>
    <button on:click={() => ($maxDate = dayjs($maxDate).add(1, 'day').toDate())}>+1 Tag</button>
    <button on:click={() => ($maxDate = dayjs($maxDate).add(1, 'week').toDate())}>+1 Woche</button>
    <button on:click={() => ($maxDate = dayjs($maxDate).add(1, 'month').toDate())}
        >+1 Monat</button
    >
</div>

<style>
    div {
        z-index: 20;
        text-align: center;
        position: sticky;
        top: 0px;
        background: white;
        padding-top: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
    }
</style>
