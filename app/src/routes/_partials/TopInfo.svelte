<script>
    import { fmtTemp, fmtRain } from '$lib/formats';
    import { minDate, maxDate } from '$lib/stores';
    import dayjs from 'dayjs';

    export let station;
    export let today;

    $: tempSentence = today.TXK > today.context.TXK_hi ? 'überdurchschnittlich warm' :
        today.TXK < today.context.TXK_lo ? 'überdurchschnittlich kalt' :
        'durchschnittlich warm';

    $: precipSentence = today.rain30days > today.context.rain30days_hi ? 'überdurchschnittlich viel' :
        today.rain30days < today.context.rain30days_lo ? 'überdurchschnittlich wenig' :
        'durchschnittlich viel';

    $: tempClass = today.TXK > today.context.TXK_hi ? 'high' :
        today.TXK < today.context.TXK_lo ? 'low' :
        'normal';

    $: precipClass = today.rain30days > today.context.rain30days_hi ? 'high' :
        today.rain30days < today.context.rain30days_lo ? 'low' :
        'normal';
</script>

<style>
    .flex {
        display: flex;
        width: 100%;
        font-size: 1.5rem;
    }
    .flex div {
        width: 50%;
        text-align: center;
    }
    b {
        padding: 2px 4px;
        border-radius: 4px;
        display: inline;
    }
    .temp-high {
        background: #dc35453b;
    }
    .temp-low {
        background: #17a2b82b;
    }
    .rain-high {
        background: #007bff30;
    }
    .rain-low {
        background: #fd7e1442;
    }
</style>

<div class="flex">
    <div>
        <b>{dayjs($maxDate).format('LL')}</b><br>
        max. {fmtTemp(today.TXK)}<br>
        {fmtRain(today.RSK)}<br>
    </div>
    <div>
        Heute ist es in {station.name} <b class="temp-{tempClass}">{tempSentence}</b>. Außerdem <b class="rain-{precipClass}">regnet</b> es gerade (die letzten 30 Tage) <b class="rain-{precipClass}">{precipSentence}</b>.
    </div>
</div>